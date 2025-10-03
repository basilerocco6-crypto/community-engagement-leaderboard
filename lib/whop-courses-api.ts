import { createClient } from '@/lib/supabase';

export interface WhopCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  modules: WhopCourseModule[];
  total_modules: number;
  points_value: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhopCourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  duration_minutes?: number;
  order_index: number;
  points_value: number;
  is_required: boolean;
  prerequisites: string[];
  content_url?: string;
  quiz_data?: any;
  created_at: string;
}

export interface WhopUserProgress {
  user_id: string;
  course_id: string;
  completed_modules: string[];
  current_module_id?: string;
  progress_percentage: number;
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
  certificate_issued?: boolean;
}

export interface WhopModuleCompletion {
  user_id: string;
  course_id: string;
  module_id: string;
  completed_at: string;
  time_spent_minutes?: number;
  score?: number;
  attempts?: number;
}

export class WhopCoursesAPI {
  private static baseUrl = 'https://api.whop.com/v1';
  private static apiKey = process.env.WHOP_API_KEY;

  /**
   * Get all available courses
   */
  static async getCourses(filters?: {
    category?: string;
    difficulty?: string;
    published_only?: boolean;
  }): Promise<WhopCourse[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.published_only) params.append('published', 'true');

      const response = await fetch(`${this.baseUrl}/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.courses || [];

    } catch (error) {
      console.error('Error fetching courses from Whop:', error);
      return [];
    }
  }

  /**
   * Get specific course details with modules
   */
  static async getCourse(courseId: string): Promise<WhopCourse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.course;

    } catch (error) {
      console.error('Error fetching course from Whop:', error);
      return null;
    }
  }

  /**
   * Get course modules
   */
  static async getCourseModules(courseId: string): Promise<WhopCourseModule[]> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/modules`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.modules || [];

    } catch (error) {
      console.error('Error fetching course modules from Whop:', error);
      return [];
    }
  }

  /**
   * Get user's course progress
   */
  static async getUserCourseProgress(userId: string, courseId?: string): Promise<WhopUserProgress[]> {
    try {
      const endpoint = courseId 
        ? `${this.baseUrl}/users/${userId}/courses/${courseId}/progress`
        : `${this.baseUrl}/users/${userId}/courses/progress`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return courseId ? [data.progress] : data.progress || [];

    } catch (error) {
      console.error('Error fetching user course progress from Whop:', error);
      return [];
    }
  }

  /**
   * Get user's module completions
   */
  static async getUserModuleCompletions(userId: string, courseId?: string): Promise<WhopModuleCompletion[]> {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);

      const response = await fetch(`${this.baseUrl}/users/${userId}/modules/completions?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.completions || [];

    } catch (error) {
      console.error('Error fetching user module completions from Whop:', error);
      return [];
    }
  }

  /**
   * Mark module as completed (if we need to update Whop)
   */
  static async markModuleCompleted(userId: string, moduleId: string, completionData: {
    time_spent_minutes?: number;
    score?: number;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/modules/${moduleId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionData)
      });

      return response.ok;

    } catch (error) {
      console.error('Error marking module as completed in Whop:', error);
      return false;
    }
  }

  /**
   * Sync course data to our local database
   */
  static async syncCoursesToDatabase(): Promise<{ synced: number; errors: number }> {
    const supabase = createClient();
    let synced = 0;
    let errors = 0;

    try {
      // Fetch all courses from Whop
      const courses = await this.getCourses({ published_only: true });

      for (const course of courses) {
        try {
          // Upsert course data
          const { error: courseError } = await supabase
            .from('whop_courses')
            .upsert({
              whop_course_id: course.id,
              title: course.title,
              description: course.description,
              thumbnail_url: course.thumbnail_url,
              duration_minutes: course.duration_minutes,
              difficulty_level: course.difficulty_level,
              category: course.category,
              instructor_name: course.instructor.name,
              instructor_avatar: course.instructor.avatar_url,
              total_modules: course.total_modules,
              points_value: course.points_value,
              is_published: course.is_published,
              whop_created_at: course.created_at,
              whop_updated_at: course.updated_at,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'whop_course_id'
            });

          if (courseError) {
            console.error('Error syncing course:', courseError);
            errors++;
            continue;
          }

          // Sync course modules
          for (const module of course.modules) {
            const { error: moduleError } = await supabase
              .from('whop_course_modules')
              .upsert({
                whop_module_id: module.id,
                whop_course_id: course.id,
                title: module.title,
                description: module.description,
                content_type: module.content_type,
                duration_minutes: module.duration_minutes,
                order_index: module.order_index,
                points_value: module.points_value,
                is_required: module.is_required,
                prerequisites: module.prerequisites,
                content_url: module.content_url,
                quiz_data: module.quiz_data,
                whop_created_at: module.created_at,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'whop_module_id'
              });

            if (moduleError) {
              console.error('Error syncing module:', moduleError);
              errors++;
            }
          }

          synced++;

        } catch (error) {
          console.error('Error processing course:', error);
          errors++;
        }
      }

      return { synced, errors };

    } catch (error) {
      console.error('Error syncing courses to database:', error);
      return { synced, errors: errors + 1 };
    }
  }

  /**
   * Sync user progress to our database
   */
  static async syncUserProgress(userId: string): Promise<{ synced: number; errors: number }> {
    const supabase = createClient();
    let synced = 0;
    let errors = 0;

    try {
      // Get user's course progress from Whop
      const progressData = await this.getUserCourseProgress(userId);
      const completions = await this.getUserModuleCompletions(userId);

      // Sync course progress
      for (const progress of progressData) {
        try {
          const { error: progressError } = await supabase
            .from('user_course_progress')
            .upsert({
              user_id: userId,
              whop_course_id: progress.course_id,
              completed_modules: progress.completed_modules,
              current_module_id: progress.current_module_id,
              progress_percentage: progress.progress_percentage,
              started_at: progress.started_at,
              last_accessed_at: progress.last_accessed_at,
              completed_at: progress.completed_at,
              certificate_issued: progress.certificate_issued,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,whop_course_id'
            });

          if (progressError) {
            console.error('Error syncing user progress:', progressError);
            errors++;
          } else {
            synced++;
          }

        } catch (error) {
          console.error('Error processing user progress:', error);
          errors++;
        }
      }

      // Sync module completions
      for (const completion of completions) {
        try {
          const { error: completionError } = await supabase
            .from('user_module_completions')
            .upsert({
              user_id: userId,
              whop_course_id: completion.course_id,
              whop_module_id: completion.module_id,
              completed_at: completion.completed_at,
              time_spent_minutes: completion.time_spent_minutes,
              score: completion.score,
              attempts: completion.attempts,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,whop_module_id'
            });

          if (completionError) {
            console.error('Error syncing module completion:', completionError);
            errors++;
          }

        } catch (error) {
          console.error('Error processing module completion:', error);
          errors++;
        }
      }

      return { synced, errors };

    } catch (error) {
      console.error('Error syncing user progress:', error);
      return { synced, errors: errors + 1 };
    }
  }

  /**
   * Get course completion statistics
   */
  static async getCourseStats(courseId: string): Promise<{
    total_enrolled: number;
    total_completed: number;
    completion_rate: number;
    average_time_to_complete: number;
    popular_modules: Array<{ module_id: string; completion_count: number }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/stats`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.stats;

    } catch (error) {
      console.error('Error fetching course stats from Whop:', error);
      return {
        total_enrolled: 0,
        total_completed: 0,
        completion_rate: 0,
        average_time_to_complete: 0,
        popular_modules: []
      };
    }
  }
}

// Course-specific engagement tracking
export class CourseEngagementTracker {
  private static supabase = createClient();

  /**
   * Process course module completion and award points
   */
  static async processModuleCompletion(data: {
    user_id: string;
    course_id: string;
    module_id: string;
    time_spent_minutes?: number;
    score?: number;
  }): Promise<{ success: boolean; points_awarded: number; tier_upgraded?: boolean }> {
    try {
      // Get module details from our database
      const { data: moduleData, error: moduleError } = await this.supabase
        .from('whop_course_modules')
        .select('*')
        .eq('whop_module_id', data.module_id)
        .single();

      if (moduleError || !moduleData) {
        throw new Error('Module not found in database');
      }

      // Get course details
      const { data: courseData, error: courseError } = await this.supabase
        .from('whop_courses')
        .select('*')
        .eq('whop_course_id', data.course_id)
        .single();

      if (courseError || !courseData) {
        throw new Error('Course not found in database');
      }

      // Calculate points to award
      let pointsToAward = moduleData.points_value || 25; // Default module points

      // Bonus points for high scores
      if (data.score && data.score >= 90) {
        pointsToAward += 10; // Perfect score bonus
      } else if (data.score && data.score >= 80) {
        pointsToAward += 5; // High score bonus
      }

      // Bonus points for time efficiency (completed faster than expected)
      if (data.time_spent_minutes && moduleData.duration_minutes) {
        const efficiency = moduleData.duration_minutes / data.time_spent_minutes;
        if (efficiency > 1.5) {
          pointsToAward += 5; // Efficiency bonus
        }
      }

      // Record the engagement event
      const { error: engagementError } = await this.supabase
        .from('engagement_events')
        .insert({
          user_id: data.user_id,
          activity_type: 'LESSON_COMPLETED',
          points_awarded: pointsToAward,
          metadata: {
            source: 'whop_courses',
            course_id: data.course_id,
            course_title: courseData.title,
            module_id: data.module_id,
            module_title: moduleData.title,
            content_type: moduleData.content_type,
            time_spent_minutes: data.time_spent_minutes,
            score: data.score,
            efficiency_bonus: data.time_spent_minutes && moduleData.duration_minutes ? 
              moduleData.duration_minutes / data.time_spent_minutes > 1.5 : false,
            score_bonus: data.score ? (data.score >= 90 ? 10 : data.score >= 80 ? 5 : 0) : 0
          },
          created_at: new Date().toISOString()
        });

      if (engagementError) {
        throw engagementError;
      }

      // Update user's total points
      const { error: updateError } = await this.supabase
        .from('user_engagement')
        .update({
          total_points: this.supabase.raw('total_points + ?', [pointsToAward]),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.user_id);

      if (updateError) {
        throw updateError;
      }

      // Check for tier upgrade (this will be handled by database triggers)
      // But we can check if it happened
      const { data: userAfter } = await this.supabase
        .from('user_engagement')
        .select('current_tier, total_points')
        .eq('user_id', data.user_id)
        .single();

      return {
        success: true,
        points_awarded: pointsToAward,
        tier_upgraded: false // Would need to compare before/after tier
      };

    } catch (error) {
      console.error('Error processing module completion:', error);
      return { success: false, points_awarded: 0 };
    }
  }

  /**
   * Process full course completion
   */
  static async processCourseCompletion(data: {
    user_id: string;
    course_id: string;
    completion_time_days: number;
    final_score?: number;
  }): Promise<{ success: boolean; points_awarded: number; certificate_issued?: boolean }> {
    try {
      // Get course details
      const { data: courseData, error: courseError } = await this.supabase
        .from('whop_courses')
        .select('*')
        .eq('whop_course_id', data.course_id)
        .single();

      if (courseError || !courseData) {
        throw new Error('Course not found in database');
      }

      // Calculate completion bonus points
      let bonusPoints = courseData.points_value || 100; // Base course completion points

      // Fast completion bonus
      if (data.completion_time_days <= 7) {
        bonusPoints += 50; // Week completion bonus
      } else if (data.completion_time_days <= 14) {
        bonusPoints += 25; // Two week completion bonus
      }

      // High score bonus
      if (data.final_score && data.final_score >= 95) {
        bonusPoints += 30; // Excellence bonus
      } else if (data.final_score && data.final_score >= 85) {
        bonusPoints += 15; // High achievement bonus
      }

      // Record the course completion event
      const { error: engagementError } = await this.supabase
        .from('engagement_events')
        .insert({
          user_id: data.user_id,
          activity_type: 'COURSE_COMPLETED',
          points_awarded: bonusPoints,
          metadata: {
            source: 'whop_courses',
            course_id: data.course_id,
            course_title: courseData.title,
            course_category: courseData.category,
            difficulty_level: courseData.difficulty_level,
            completion_time_days: data.completion_time_days,
            final_score: data.final_score,
            fast_completion_bonus: data.completion_time_days <= 7 ? 50 : data.completion_time_days <= 14 ? 25 : 0,
            score_bonus: data.final_score ? (data.final_score >= 95 ? 30 : data.final_score >= 85 ? 15 : 0) : 0
          },
          created_at: new Date().toISOString()
        });

      if (engagementError) {
        throw engagementError;
      }

      // Update user's total points
      const { error: updateError } = await this.supabase
        .from('user_engagement')
        .update({
          total_points: this.supabase.raw('total_points + ?', [bonusPoints]),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.user_id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        points_awarded: bonusPoints,
        certificate_issued: true // Assume certificate is issued for course completion
      };

    } catch (error) {
      console.error('Error processing course completion:', error);
      return { success: false, points_awarded: 0 };
    }
  }

  /**
   * Get user's course engagement history
   */
  static async getUserCourseHistory(userId: string): Promise<Array<{
    course_title: string;
    module_title?: string;
    activity_type: string;
    points_awarded: number;
    completed_at: string;
    metadata: any;
  }>> {
    try {
      const { data: history, error } = await this.supabase
        .from('engagement_events')
        .select('*')
        .eq('user_id', userId)
        .in('activity_type', ['LESSON_COMPLETED', 'COURSE_COMPLETED'])
        .not('metadata->course_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (history || []).map(event => ({
        course_title: event.metadata.course_title || 'Unknown Course',
        module_title: event.metadata.module_title,
        activity_type: event.activity_type,
        points_awarded: event.points_awarded,
        completed_at: event.created_at,
        metadata: event.metadata
      }));

    } catch (error) {
      console.error('Error fetching user course history:', error);
      return [];
    }
  }
}
