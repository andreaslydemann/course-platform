import { Injectable } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { produce } from 'immer';
import { Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { UserService } from '@course-platform/shared/feat-auth';
import {
  Course,
  CourseSection,
  Lesson
} from '@course-platform/shared/interfaces';
import { courseFragments } from './course-fragments';

export const COURSE_SECTIONS_URL = '/api/sections';

export interface CourseSectionDTO {
  id: string;
  name: string;
  lessons: DocumentReference[];
}

export interface LessonDTO {
  id: string;
  name: string;
  videoUrl: string;
  description: string;
  resources: DocumentReference[];
  // set by client
  isCompleted?: boolean;
}

export interface CompletedLessonData {
  lessonId: string;
  completed: boolean;
  lastUpdated: boolean;
}

export interface GetCourseSectionsResponseDTO {
  courseSections: CourseSection[];
  user: {
    completedLessons: CompletedLessonData[];
  };
}

export interface GetCoursesResponseDTO {
  course: Course[];
}

export const courseSectionsQuery = gql`
  query GetCourseSectionsQuery($uid: String!, $courseId: String!) {
    courseSections(uid: $uid, courseId: $courseId) {
      id
      name
      theme
      lessons {
        ...LessonFields
      }
      actionItems {
        id
        isCompleted
        question
        answerDescription
      }
    }
    user(uid: $uid) {
      completedLessons {
        lessonId
        completed
        lastUpdated
      }
    }
  }

  ${courseFragments.lesson}
`;

@Injectable({
  providedIn: 'root'
})
export class CourseResourcesService {
  private courseId: string;
  constructor(private apollo: Apollo, private userService: UserService) {}

  getCourses(): Observable<Course[]> {
    const coursesQuery = gql`
      query getCourses {
        course {
          id
          name
          description
        }
      }
    `;

    return this.apollo
      .watchQuery<GetCoursesResponseDTO>({ query: coursesQuery })
      .valueChanges.pipe(
        map(({ data }) => {
          return data.course;
        })
      );
  }

  getCourseSections(courseId: string): Observable<CourseSection[]> {
    this.courseId = courseId;
    return this.userService.getCurrentUser().pipe(
      switchMap(user => {
        return this.apollo
          .watchQuery<GetCourseSectionsResponseDTO>({
            query: courseSectionsQuery,
            variables: {
              uid: user.uid,
              courseId
            }
          })
          .valueChanges.pipe(
            map(({ data }) => {
              const updatedSections = data.courseSections.map(section => {
                const completedLessonsMap = data.user.completedLessons.reduce(
                  (prev, cur) => {
                    if (!cur.completed) {
                      return { ...prev };
                    }

                    return { ...prev, [cur.lessonId]: true };
                  },
                  {}
                );
                return {
                  ...section,
                  lessons: section.lessons.map(lesson => ({
                    ...lesson,
                    isCompleted: completedLessonsMap[lesson.id]
                  }))
                };
              });
              return updatedSections;
            })
          );
      })
    );
  }

  setCompleteLesson(
    isCompleted: boolean,
    lessonId: string,
    userId: string
  ): Observable<any> {
    const completedLessonMutation = gql`
      mutation {
        setLessonCompleted(
          isCompleted: ${isCompleted}
          lessonId: "${lessonId}"
          uid:"${userId}"
          )
      }
    `;

    return this.apollo.mutate({ mutation: completedLessonMutation });
  }

  createLesson(
    sectionId: string,
    lessonName: string = '',
    courseId: string
  ): Observable<string> {
    const createLessonMutation = gql`
      mutation {
        createLesson(courseId: "${courseId}", sectionId: "${sectionId}", name: "${lessonName}") {
          ...LessonFields
        }
      }

      ${courseFragments.lesson}
    `;

    return this.userService.getCurrentUser().pipe(
      switchMap(user => {
        return this.apollo
          .mutate<any>({
            mutation: createLessonMutation,
            update: (cache, { data: { createLesson } }) => {
              const courseSectionsData = cache.readQuery<
                GetCourseSectionsResponseDTO
              >({
                query: courseSectionsQuery,
                variables: { uid: user.uid, courseId: this.courseId }
              });

              cache.writeQuery({
                query: courseSectionsQuery,
                data: {
                  ...courseSectionsData,
                  courseSections: [
                    ...courseSectionsData.courseSections.reduce(
                      (prev, section) => {
                        const currentSection =
                          section.id === sectionId
                            ? {
                                ...section,
                                lessons: [...section.lessons, createLesson]
                              }
                            : section;
                        return [
                          ...prev,
                          { ...currentSection } as CourseSection
                        ];
                      },
                      []
                    )
                  ]
                },
                variables: { uid: user.uid, courseId: this.courseId }
              });
            }
          })
          .pipe(map(({ data }) => data));
      })
    );
  }

  updateLesson(lesson: Lesson, courseId: string) {
    const updateLessonMutation = gql`
      mutation updateLessonMutation(
        $courseId: ID!
        $id: ID!
        $name: String
        $description: String
        $videoUrl: String
        $resources: [LessonResourceInput]
      ) {
        updateLesson(
          courseId: $courseId
          id: $id
          name: $name
          description: $description
          videoUrl: $videoUrl
          resources: $resources
        ) {
          ...LessonFields
        }
      }

      ${courseFragments.lesson}
    `;

    return this.userService.getCurrentUser().pipe(
      first(),
      switchMap(user => {
        return this.apollo.mutate<any>({
          mutation: updateLessonMutation,
          variables: {
            courseId,
            id: lesson.id,
            name: lesson.name,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            resources: lesson.resources
          },
          update: (cache, { data: { updateLesson } }) => {
            const courseSectionsData = cache.readQuery<
              GetCourseSectionsResponseDTO
            >({
              query: courseSectionsQuery,
              variables: { uid: user.uid, courseId: this.courseId }
            });

            cache.writeQuery({
              query: courseSectionsQuery,
              data: {
                ...courseSectionsData,
                courseSections: [
                  ...courseSectionsData.courseSections.reduce(
                    (prev, section) => {
                      const currentLessonIdx = section.lessons.findIndex(
                        les => les.id === lesson.id
                      );

                      const updatedSection = produce(section, draft => {
                        if (currentLessonIdx !== -1) {
                          draft.lessons[currentLessonIdx] = updateLesson;
                        }
                      });

                      return [...prev, { ...updatedSection } as CourseSection];
                    },
                    []
                  )
                ]
              },
              variables: { uid: user.uid, courseId: this.courseId }
            });
          }
        });
      })
    );
  }

  deleteLesson(sectionId: string, lessonId: string, courseId: string) {
    const deleteLessonMutation = gql`
      mutation deleteLessonMutation(
        $courseId: ID!
        $sectionId: String!
        $lessonId: ID!
      ) {
        deleteLesson(courseId: $courseId, sectionId: $sectionId, id: $lessonId)
      }
    `;
    return this.userService.getCurrentUser().pipe(
      switchMap(user => {
        return this.apollo.mutate({
          mutation: deleteLessonMutation,
          variables: { courseId: this.courseId, sectionId, lessonId },
          refetchQueries: [
            {
              query: courseSectionsQuery,
              variables: { uid: user.uid, courseId: this.courseId }
            }
          ]
        });
      })
    );
  }

  setActionItemCompleted(resourceId: string, completed: boolean) {
    const setActionItemCompletedMutation = gql`
      mutation setActionItemCompletedMutation($uid: ID!) {
        setActionItemCompleted(
          uid: $uid
          id: "${resourceId}"
          isCompleted: ${completed},
        )
      }
    `;

    return this.userService.getCurrentUser().pipe(
      switchMap(user => {
        return this.apollo.mutate({
          mutation: setActionItemCompletedMutation,
          variables: {
            uid: user.uid
          },
          refetchQueries: [
            {
              query: courseSectionsQuery,
              variables: { uid: user.uid, courseId: this.courseId }
            }
          ]
        });
      })
    );
  }

  createSection(sectionName: string, courseId: string) {
    const createSectionMutation = gql`
      mutation createSectionMutation($sectionName: String!, $courseId: ID!) {
        createSection(name: $sectionName, courseId: $courseId)
      }
    `;

    return this.apollo.mutate({
      mutation: createSectionMutation,
      variables: {
        sectionName,
        courseId
      },
      refetchQueries: [
        {
          query: courseSectionsQuery,
          variables: {
            uid: this.userService.currentUser$.value.uid,
            courseId: this.courseId
          }
        }
      ]
    });
  }

  updateSection(
    sectionId: string,
    sectionName: string,
    sectionTheme: string,
    courseId: string
  ) {
    const updateSectionMutation = gql`
      mutation updateSectionMutation(
        $sectionId: ID!
        $sectionName: String
        $sectionTheme: String
        $courseId: ID!
      ) {
        updateSection(
          id: $sectionId
          name: $sectionName
          theme: $sectionTheme
          courseId: $courseId
        )
      }
    `;

    return this.apollo.mutate({
      mutation: updateSectionMutation,
      variables: {
        sectionId,
        sectionName,
        sectionTheme,
        courseId
      },
      refetchQueries: [
        {
          query: courseSectionsQuery,
          variables: {
            uid: this.userService.currentUser$.value.uid,
            courseId: this.courseId
          }
        }
      ]
    });
  }
  deleteSection(sectionId: string, courseId: string) {
    const createSectionMutation = gql`
      mutation deleteSectionMutation($sectionId: ID!, courseId: ID!) {
        deleteSection(id: $sectionId, courseId: $courseId)
      }
    `;

    return this.apollo.mutate({
      mutation: createSectionMutation,
      variables: {
        sectionId,
        courseId
      },
      refetchQueries: [
        {
          query: courseSectionsQuery,
          variables: {
            uid: this.userService.currentUser$.value.uid,
            courseId: this.courseId
          }
        }
      ]
    });
  }
}
