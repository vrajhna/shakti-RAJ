-- 005_learn_university: categories, courses, modules, lessons, quizzes, progress, bookmarks, reviews
CREATE TABLE IF NOT EXISTS learn_categories(
  id TEXT PRIMARY KEY, title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  icon TEXT DEFAULT '', color TEXT DEFAULT '', sort INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS learn_courses(
  id TEXT PRIMARY KEY, cat_id TEXT REFERENCES learn_categories(id),
  title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  desc_hi TEXT DEFAULT '', desc_en TEXT DEFAULT '',
  level TEXT DEFAULT 'beginner', dur TEXT DEFAULT '',
  img TEXT DEFAULT '', skills TEXT[] DEFAULT '{}',
  related_jobs TEXT DEFAULT '', status TEXT DEFAULT 'draft',
  translation_status TEXT DEFAULT 'reviewed:hi,en; pending:others',
  reviewer TEXT DEFAULT '', reviewed_at TEXT DEFAULT '', sources TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learn_courses_cat ON learn_courses(cat_id);
CREATE INDEX IF NOT EXISTS idx_learn_courses_status ON learn_courses(status);
CREATE TABLE IF NOT EXISTS learn_modules(
  id TEXT PRIMARY KEY, course_id TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,
  pos INT DEFAULT 0, title_hi TEXT NOT NULL, title_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_lessons(
  id TEXT PRIMARY KEY, module_id TEXT REFERENCES learn_modules(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,
  pos INT DEFAULT 0, title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  body_hi TEXT DEFAULT '', body_en TEXT DEFAULT '',
  steps_hi TEXT[] DEFAULT '{}', steps_en TEXT[] DEFAULT '{}',
  practice_hi TEXT DEFAULT '', practice_en TEXT DEFAULT '',
  safety_hi TEXT DEFAULT '', safety_en TEXT DEFAULT '',
  mins INT DEFAULT 5
);
CREATE INDEX IF NOT EXISTS idx_learn_lessons_course ON learn_lessons(course_id);
CREATE TABLE IF NOT EXISTS learn_quizzes(
  id TEXT PRIMARY KEY, lesson_id TEXT REFERENCES learn_lessons(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES learn_courses(id) ON DELETE CASCADE,
  question_hi TEXT NOT NULL, question_en TEXT NOT NULL,
  options_hi TEXT[] DEFAULT '{}', options_en TEXT[] DEFAULT '{}',
  answer INT DEFAULT 0, explain_hi TEXT DEFAULT '', explain_en TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS learn_progress(
  user_id TEXT REFERENCES users(id), lesson_id TEXT REFERENCES learn_lessons(id),
  course_id TEXT REFERENCES learn_courses(id),
  done BOOLEAN DEFAULT true, quiz_score INT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS learn_bookmarks(
  user_id TEXT REFERENCES users(id), course_id TEXT REFERENCES learn_courses(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(user_id, course_id)
);
CREATE TABLE IF NOT EXISTS learn_reviews(
  id TEXT PRIMARY KEY, course_id TEXT REFERENCES learn_courses(id),
  user_id TEXT REFERENCES users(id),
  rating INT DEFAULT 5, message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS govt_schemes(
  id TEXT PRIMARY KEY, title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  dept TEXT DEFAULT '', benefit_hi TEXT DEFAULT '', benefit_en TEXT DEFAULT '',
  who_hi TEXT DEFAULT '', who_en TEXT DEFAULT '',
  portal TEXT DEFAULT '', demo BOOLEAN DEFAULT false
);
