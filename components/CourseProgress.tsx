'use client';

import React, { useState, useEffect } from 'react';

interface CourseProgressData {
  course_id: string;
  course_title: string;
  course_category: string;
  difficulty_level: string;
  thumbnail_url?: string;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number;
  last_accessed_at?: string;
  completed_at?: string;
  certificate_issued: boolean;
}

interface CourseHistoryItem {
  course_title: string;
  module_title?: string;
  activity_type: string;
  points_awarded: number;
  completed_at: string;
  metadata: any;
}

interface CourseProgressProps {
  userId: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function CourseProgress({ userId, showHistory = true, compact = false }: CourseProgressProps) {
  const [courses, setCourses] = useState<CourseProgressData[]>([]);
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    loadCourseProgress();
  }, [userId]);

  const loadCourseProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/progress/${userId}`);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data.courses);
        if (showHistory) {
          setHistory(data.data.history);
        }
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromWhop = async () => {
    try {
      const response = await fetch(`/api/courses/progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_from_whop: true })
      });

      const data = await response.json();
      if (data.success) {
        await loadCourseProgress();
        alert('Course progress synced successfully!');
      }
    } catch (error) {
      console.error('Error syncing course progress:', error);
      alert('Failed to sync course progress');
    }
  };

  if (loading) {
    return <CourseProgressSkeleton compact={compact} />;
  }

  if (compact) {
    return <CompactCourseProgress courses={courses} onSync={syncFromWhop} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">📚 Course Progress</h3>
          <p className="text-white/70">Track your learning journey</p>
        </div>
        <button
          onClick={syncFromWhop}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          🔄 Sync from Whop
        </button>
      </div>

      {/* Course Progress Cards */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseProgressCard
              key={course.course_id}
              course={course}
              onClick={() => setSelectedCourse(course.course_id)}
              isSelected={selectedCourse === course.course_id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-xl font-bold text-white mb-2">No Courses Started</h3>
          <p className="text-white/70 mb-4">Start learning to see your progress here</p>
          <button
            onClick={syncFromWhop}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sync Course Data
          </button>
        </div>
      )}

      {/* Course History */}
      {showHistory && history.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">📈 Recent Learning Activity</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map((item, index) => (
              <CourseHistoryItem key={index} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Course Progress Card Component
function CourseProgressCard({ 
  course, 
  onClick, 
  isSelected 
}: { 
  course: CourseProgressData; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-white/70';
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-white/20 border-blue-400/50 shadow-lg scale-105' 
          : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
        }
      `}
    >
      {/* Course Header */}
      <div className="flex items-start gap-3 mb-3">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.course_title}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {course.course_title.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{course.course_title}</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/70">{course.course_category}</span>
            <span className={getDifficultyColor(course.difficulty_level)}>
              {getDifficultyIcon(course.difficulty_level)} {course.difficulty_level}
            </span>
          </div>
        </div>
        {course.completed_at && (
          <div className="text-green-400">
            {course.certificate_issued ? '🏆' : '✅'}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-white/80">Progress</span>
          <span className="text-white font-medium">{course.progress_percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${course.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Module Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">
          {course.completed_modules} / {course.total_modules} modules
        </span>
        {course.last_accessed_at && (
          <span className="text-white/60">
            {new Date(course.last_accessed_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Completion Status */}
      {course.completed_at && (
        <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-200 text-sm">
            <span>🎉</span>
            <span>Completed {new Date(course.completed_at).toLocaleDateString()}</span>
            {course.certificate_issued && <span>• Certificate Issued</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Course History Item Component
function CourseHistoryItem({ item }: { item: CourseHistoryItem }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'LESSON_COMPLETED': return '📚';
      case 'COURSE_COMPLETED': return '🎓';
      default: return '⭐';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'LESSON_COMPLETED': return 'Module Completed';
      case 'COURSE_COMPLETED': return 'Course Completed';
      default: return 'Activity';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
      <span className="text-xl">{getActivityIcon(item.activity_type)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">
          {item.module_title || item.course_title}
        </div>
        <div className="text-white/70 text-sm">
          {getActivityLabel(item.activity_type)} • {item.course_title}
        </div>
      </div>
      <div className="text-right">
        <div className="text-green-400 font-medium">+{item.points_awarded}</div>
        <div className="text-white/60 text-xs">
          {new Date(item.completed_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// Compact Course Progress Component
function CompactCourseProgress({ 
  courses, 
  onSync 
}: { 
  courses: CourseProgressData[]; 
  onSync: () => void;
}) {
  const activeCourses = courses.filter(c => !c.completed_at && c.progress_percentage > 0);
  const completedCourses = courses.filter(c => c.completed_at);

  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">📚 Learning Progress</h4>
        <button
          onClick={onSync}
          className="text-white/70 hover:text-white text-sm"
        >
          🔄
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{courses.length}</div>
          <div className="text-xs text-white/70">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">{activeCourses.length}</div>
          <div className="text-xs text-white/70">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{completedCourses.length}</div>
          <div className="text-xs text-white/70">Completed</div>
        </div>
      </div>

      {/* Active Courses */}
      {activeCourses.length > 0 && (
        <div className="space-y-2">
          {activeCourses.slice(0, 3).map((course) => (
            <div key={course.course_id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {course.course_title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{course.course_title}</div>
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${course.progress_percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-white/70 text-xs">
                {course.progress_percentage.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-4">
          <div className="text-white/70 text-sm">No courses started yet</div>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function CourseProgressSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="bg-white/10 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-32 h-5 bg-white/20 rounded"></div>
          <div className="w-6 h-6 bg-white/20 rounded"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-6 bg-white/20 rounded mx-auto mb-1"></div>
              <div className="w-12 h-3 bg-white/20 rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded"></div>
              <div className="flex-1">
                <div className="w-24 h-3 bg-white/20 rounded mb-1"></div>
                <div className="w-full h-1 bg-white/20 rounded"></div>
              </div>
              <div className="w-8 h-3 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="w-48 h-6 bg-white/20 rounded mb-2"></div>
          <div className="w-32 h-4 bg-white/20 rounded"></div>
        </div>
        <div className="w-32 h-10 bg-white/20 rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-white/10 rounded-xl">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-white/20 rounded mb-1"></div>
                <div className="w-24 h-3 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="mb-3">
              <div className="w-16 h-3 bg-white/20 rounded mb-1"></div>
              <div className="w-full h-2 bg-white/20 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="w-20 h-3 bg-white/20 rounded"></div>
              <div className="w-16 h-3 bg-white/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
