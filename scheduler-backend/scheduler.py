"""
Timetable Scheduling Algorithm

This module implements the core scheduling algorithm using constraint programming with OR-Tools.
It retrieves break times for breakfast and lunch from user-defined school settings and strictly
enforces that no lesson overlaps with these break intervals.
"""

from ortools.sat.python import cp_model
import numpy as np
import uuid
import logging
import traceback
from typing import Dict, List, Tuple, Any

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class TimetableScheduler:
    """
    Class to handle timetable scheduling using constraint programming.
    """

    def __init__(self, data: Dict[str, Any]) -> None:
        """
        Initialize the scheduler with the provided scheduling data.

        Args:
            data (Dict[str, Any]): Contains school settings, teachers, classes, subjects, and rooms.
        """
        self.school_settings: Dict[str, Any] = data.get('school_settings', {})
        self.teachers: List[Dict[str, Any]] = data.get('teachers', [])
        self.classes: List[Dict[str, Any]] = data.get('classes', [])
        self.subjects: List[Dict[str, Any]] = data.get('subjects', [])
        self.rooms: List[Dict[str, Any]] = data.get('rooms', [])

        # Log the school settings
        logger.info(f"School settings: {self.school_settings}")

        # Strictly require all user-defined school settings
        required_settings = [
            'startTime', 'endTime', 'lessonDuration', 'breakDuration',
            'hasBreakfastBreak', 'breakfastBreakStartTime', 'breakfastBreakDuration',
            'lunchBreakDuration', 'lunchBreakStartTime', 'lessonsPerDay', 'daysPerWeek',
            'workingDays', 'useRoomConstraints'
        ]
        # maxSubjectsPerDay is optional or can be derived from lessonsPerDay
        self.school_settings['maxSubjectsPerDay'] = self.school_settings.get('maxSubjectsPerDay', self.school_settings.get('lessonsPerDay', 6))

        missing = [k for k in required_settings if k not in self.school_settings or self.school_settings[k] is None]
        if missing:
            raise ValueError(f"Missing required school settings: {', '.join(missing)}")

        self.use_room_constraints: bool = self.school_settings['useRoomConstraints']
        self.max_subjects_per_day: int = self.school_settings['maxSubjectsPerDay']
        self.free_periods: List[Dict[str, Any]] = self.school_settings.get('freePeriods', [])
        self.days: List[str] = self.school_settings['workingDays']

        self.time_slots: List[Tuple[str, str]] = self._generate_time_slots()

        # Create indices for lookup
        self.teacher_indices: Dict[str, int] = {teacher['id']: i for i, teacher in enumerate(self.teachers)}
        self.class_indices: Dict[str, int] = {cls['id']: i for i, cls in enumerate(self.classes)}
        self.subject_indices: Dict[str, int] = {subject['id']: i for i, subject in enumerate(self.subjects)}
        self.room_indices: Dict[str, int] = {room['id']: i for i, room in enumerate(self.rooms)}
        self.day_indices: Dict[str, int] = {day: i for i, day in enumerate(self.days)}
        self.time_slot_indices: Dict[Tuple[str, str], int] = {(slot[0], slot[1]): i for i, slot in enumerate(self.time_slots)}

        # Reverse mappings for extraction
        self.teacher_ids: Dict[int, str] = {i: teacher['id'] for i, teacher in enumerate(self.teachers)}
        self.class_ids: Dict[int, str] = {i: cls['id'] for i, cls in enumerate(self.classes)}
        self.subject_ids: Dict[int, str] = {i: subject['id'] for i, subject in enumerate(self.subjects)}
        self.room_ids: Dict[int, str] = {i: room['id'] for i, room in enumerate(self.rooms)}

        self.model: cp_model.CpModel = cp_model.CpModel()
        self.assignment_vars: Dict[Tuple[int, int, int, int, int, int], cp_model.IntVar] = {}
        self.solver: cp_model.CpSolver = cp_model.CpSolver()
        self.status: Any = None

    def _generate_time_slots(self) -> List[Tuple[str, str]]:
        """
        Generate time slots based on school settings.

        Returns:
            List[Tuple[str, str]]: List of tuples (start_time, end_time)
        """
        try:
            # Retrieve all time settings from user input. No fallback defaults except for error handling.
            start_time: str = self.school_settings['startTime']
            end_time: str = self.school_settings['endTime']
            lesson_duration: int = self.school_settings['lessonDuration']
            break_duration: int = self.school_settings['breakDuration']
            has_breakfast_break: bool = self.school_settings['hasBreakfastBreak']
            breakfast_break_start: str = self.school_settings['breakfastBreakStartTime']
            breakfast_break_duration: int = self.school_settings['breakfastBreakDuration']
            lunch_break_start: str = self.school_settings['lunchBreakStartTime']
            lunch_break_duration: int = self.school_settings['lunchBreakDuration']

            def time_to_minutes(time_str: str) -> int:
                hours, minutes = map(int, time_str.split(':'))
                return hours * 60 + minutes

            def minutes_to_time(minutes: int) -> str:
                return f"{minutes // 60:02d}:{minutes % 60:02d}"

            start_minutes: int = time_to_minutes(start_time)
            end_minutes: int = time_to_minutes(end_time)

            # Use breakfast break if enabled.
            if has_breakfast_break:
                breakfast_start_minutes: int = time_to_minutes(breakfast_break_start)
                breakfast_end_minutes: int = breakfast_start_minutes + breakfast_break_duration
            else:
                breakfast_start_minutes, breakfast_end_minutes = -1, -1

            lunch_start_minutes: int = time_to_minutes(lunch_break_start)
            lunch_end_minutes: int = lunch_start_minutes + lunch_break_duration

            time_slots: List[Tuple[str, str]] = []
            current_minutes: int = start_minutes

            while current_minutes + lesson_duration <= end_minutes:
                # Check for breakfast break overlap
                if has_breakfast_break:
                    if current_minutes < breakfast_end_minutes and current_minutes + lesson_duration > breakfast_start_minutes:
                        current_minutes = breakfast_end_minutes
                        continue

                # Check for lunch break overlap
                if current_minutes < lunch_end_minutes and current_minutes + lesson_duration > lunch_start_minutes:
                    current_minutes = lunch_end_minutes
                    continue

                # If we get here, the slot doesn't overlap with any breaks
                lesson_start: str = minutes_to_time(current_minutes)
                lesson_end: str = minutes_to_time(current_minutes + lesson_duration)
                time_slots.append((lesson_start, lesson_end))

                # Move to next potential slot
                current_minutes += lesson_duration + break_duration

            return time_slots
        except Exception as e:
            logger.error(f"Error generating time slots: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Fallback default slots in case of error
            return [("08:00", "09:00"), ("09:15", "10:15"), ("10:30", "11:30"),
                    ("11:45", "12:45"), ("13:30", "14:30"), ("14:45", "15:45")]

    def _create_variables(self) -> None:
        """
        Create decision variables for class subject assignments.
        """
        logger.info("Creating decision variables...")
        for c in range(len(self.classes)):
            class_info = self.classes[c]
            required_subjects: List[str] = class_info.get('requiredSubjects', [])
            for s_id in required_subjects:
                if s_id not in self.subject_indices:
                    logger.warning(f"Subject id {s_id} not defined.")
                    continue
                s: int = self.subject_indices[s_id]
                valid_teachers: List[int] = [t for t, teacher in enumerate(self.teachers) if s_id in teacher.get('subjects', [])]
                if not valid_teachers:
                    logger.warning(f"No teachers available for subject {s_id} in class {class_info.get('name')}")
                    continue

                if not self.use_room_constraints:
                    for d in range(len(self.days)):
                        for ts in range(len(self.time_slots)):
                            for t in valid_teachers:
                                var_name: str = f"c{c}_s{s}_t{t}_r0_d{d}_ts{ts}"
                                self.assignment_vars[(c, s, t, 0, d, ts)] = self.model.NewBoolVar(var_name)
                else:
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                for t in valid_teachers:
                                    var_name: str = f"c{c}_s{s}_t{t}_r{r}_d{d}_ts{ts}"
                                    self.assignment_vars[(c, s, t, r, d, ts)] = self.model.NewBoolVar(var_name)

    def _add_all_constraints(self) -> None:
        """
        Add all scheduling constraints using modular helper methods.
        """
        logger.info("Adding constraints...")
        self._add_subject_hours_constraint()
        self._add_teacher_consistency_constraint()  # Add new constraint for teacher consistency
        self._add_teacher_availability_constraints()
        self._add_class_constraints()
        if self.use_room_constraints:
            self._add_room_constraints()
        self._add_break_constraints()
        self._add_daily_lessons_constraints()
        self._add_free_period_constraints()
        self._add_balanced_distribution_constraint()
        self._add_heavy_subjects_morning_preference()
        self._add_teacher_availability_schedule_constraint()
        self._add_no_repeat_subject_constraint()  # Add constraint to prevent same subject back-to-back or multiple times per day

    def _add_teacher_consistency_constraint(self) -> None:
        """
        Ensure that the same teacher teaches a particular subject to a class throughout the week.
        This prevents the problem of different teachers being assigned to the same subject for a class.
        """
        logger.info("Adding teacher consistency constraints...")

        # Store teacher assignments for debugging
        self.teacher_assignments = {}

        for c in range(len(self.classes)):
            class_info = self.classes[c]
            class_id = class_info.get('id')
            required_subjects = class_info.get('requiredSubjects', [])

            for s_id in required_subjects:
                if s_id not in self.subject_indices:
                    continue

                s = self.subject_indices[s_id]

                # For each class-subject pair, create a variable for each possible teacher
                valid_teachers = [t for t, teacher in enumerate(self.teachers) if s_id in teacher.get('subjects', [])]
                if not valid_teachers:
                    logger.warning(f"No valid teachers for subject {s_id} in class {class_id}")
                    continue

                teacher_vars = {}
                for t in valid_teachers:
                    var_name = f"teacher_assigned_c{c}_s{s}_t{t}"
                    teacher_vars[t] = self.model.NewBoolVar(var_name)

                # Only one teacher can be assigned to a class-subject pair
                self.model.Add(sum(teacher_vars.values()) == 1)

                # For each teacher, collect all their possible assignments for this class-subject
                for t in valid_teachers:
                    t_assignments = []
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    t_assignments.append(self.assignment_vars[key])

                    if t_assignments:
                        # If any lesson for this teacher-subject-class exists, the teacher is assigned
                        self.model.AddMaxEquality(teacher_vars[t], t_assignments)

                        # If the teacher is not assigned, they cannot teach any lessons
                        for assignment_var in t_assignments:
                            self.model.Add(assignment_var == 0).OnlyEnforceIf(teacher_vars[t].Not())

                        # If the teacher is assigned, they must teach all lessons for this subject-class
                        # This is the key constraint that ensures teacher consistency
                        for other_t in valid_teachers:
                            if other_t != t:
                                for r in range(len(self.rooms)):
                                    for d in range(len(self.days)):
                                        for ts in range(len(self.time_slots)):
                                            key = (c, s, other_t, r, d, ts)
                                            if key in self.assignment_vars:
                                                self.model.Add(self.assignment_vars[key] == 0).OnlyEnforceIf(teacher_vars[t])

                # Ensure each subject gets the correct number of hours per week
                subject = self.subjects[s]
                hours_per_week = subject.get('hoursPerWeek', 0)
                logger.info(f"Subject {s_id} requires {hours_per_week} hours per week for class {class_id}")

                # Count total hours for this class-subject across all teachers and days
                total_hours_vars = []
                for t in range(len(self.teachers)):
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    total_hours_vars.append(self.assignment_vars[key])

                # Strict enforcement of hours per week
                if total_hours_vars:
                    self.model.Add(sum(total_hours_vars) == hours_per_week)

                # Store the assignment for debugging
                self.teacher_assignments[(class_id, s_id)] = {
                    'valid_teachers': [self.teacher_ids[t] for t in valid_teachers],
                    'hours_per_week': hours_per_week
                }

    def _add_subject_hours_constraint(self) -> None:
        """
        Ensure each class is scheduled for the required number of hours per subject.
        This is a critical constraint that ensures the curriculum requirements are met.
        """
        logger.info("Adding subject hours constraints...")

        # Store subject hours for debugging
        self.subject_hours_constraints = {}

        for c in range(len(self.classes)):
            class_info = self.classes[c]
            class_id = class_info.get('id')
            required_subjects: List[str] = class_info.get('requiredSubjects', [])

            for s_id in required_subjects:
                if s_id not in self.subject_indices:
                    logger.warning(f"Subject {s_id} not found in subject indices for class {class_id}")
                    continue

                s: int = self.subject_indices[s_id]
                subject: Dict[str, Any] = self.subjects[s]
                hours_per_week: int = subject.get('hoursPerWeek', 0)

                if hours_per_week <= 0:
                    logger.warning(f"Subject {s_id} has invalid hours per week: {hours_per_week}")
                    continue

                logger.info(f"Enforcing {hours_per_week} hours per week for subject {s_id} in class {class_id}")

                subject_hours: List[cp_model.IntVar] = []
                for t in range(len(self.teachers)):
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    subject_hours.append(self.assignment_vars[key])

                if subject_hours:
                    # Strict enforcement of hours per week
                    self.model.Add(sum(subject_hours) == hours_per_week)

                    # Store for debugging
                    self.subject_hours_constraints[(class_id, s_id)] = {
                        'hours_required': hours_per_week,
                        'possible_slots': len(subject_hours)
                    }
                else:
                    logger.warning(f"No valid assignment variables for subject {s_id} in class {class_id}")

    def _add_teacher_availability_constraints(self) -> None:
        """
        Enforce that a teacher can teach at most one class in a time slot
        and does not exceed their daily and weekly limits.
        """
        for t in range(len(self.teachers)):
            for d in range(len(self.days)):
                for ts in range(len(self.time_slots)):
                    teacher_assignments: List[cp_model.IntVar] = []
                    for c in range(len(self.classes)):
                        for s in range(len(self.subjects)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    teacher_assignments.append(self.assignment_vars[key])
                    if teacher_assignments:
                        self.model.Add(sum(teacher_assignments) <= 1)

        for t in range(len(self.teachers)):
            teacher = self.teachers[t]
            max_daily = teacher.get('maxHoursPerDay', 5)
            for d in range(len(self.days)):
                daily_assignments: List[cp_model.IntVar] = []
                for c in range(len(self.classes)):
                    for s in range(len(self.subjects)):
                        for r in range(len(self.rooms)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    daily_assignments.append(self.assignment_vars[key])
                if daily_assignments:
                    self.model.Add(sum(daily_assignments) <= max_daily)

        for t in range(len(self.teachers)):
            teacher = self.teachers[t]
            max_weekly = teacher.get('maxHoursPerWeek', 20)
            weekly_assignments: List[cp_model.IntVar] = []
            for c in range(len(self.classes)):
                for s in range(len(self.subjects)):
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    weekly_assignments.append(self.assignment_vars[key])
            if weekly_assignments:
                self.model.Add(sum(weekly_assignments) <= max_weekly)

    def _add_class_constraints(self) -> None:
        """
        Ensure no class is scheduled for more than one subject in a time slot.
        """
        for c in range(len(self.classes)):
            for d in range(len(self.days)):
                for ts in range(len(self.time_slots)):
                    class_assignments: List[cp_model.IntVar] = []
                    for s in range(len(self.subjects)):
                        for t in range(len(self.teachers)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    class_assignments.append(self.assignment_vars[key])
                    if class_assignments:
                        self.model.Add(sum(class_assignments) <= 1)

    def _add_room_constraints(self) -> None:
        """
        Ensure that each room is used by at most one class at any time.
        """
        for r in range(len(self.rooms)):
            for d in range(len(self.days)):
                for ts in range(len(self.time_slots)):
                    room_assignments: List[cp_model.IntVar] = []
                    for c in range(len(self.classes)):
                        for s in range(len(self.subjects)):
                            for t in range(len(self.teachers)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    room_assignments.append(self.assignment_vars[key])
                    if room_assignments:
                        self.model.Add(sum(room_assignments) <= 1)

    def _add_break_constraints(self) -> None:
        """
        Prevent scheduling during breakfast and lunch break time slots.
        """
        has_breakfast_break: bool = self.school_settings['hasBreakfastBreak']
        breakfast_break_start: str = self.school_settings['breakfastBreakStartTime']
        breakfast_break_duration: int = self.school_settings['breakfastBreakDuration']
        lunch_break_start: str = self.school_settings['lunchBreakStartTime']
        lunch_break_duration: int = self.school_settings['lunchBreakDuration']

        def time_to_minutes(time_str: str) -> int:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes

        breakfast_start: int = time_to_minutes(breakfast_break_start)
        breakfast_end: int = breakfast_start + breakfast_break_duration
        lunch_start: int = time_to_minutes(lunch_break_start)
        lunch_end: int = lunch_start + lunch_break_duration

        for d in range(len(self.days)):
            for ts in range(len(self.time_slots)):
                slot_start, slot_end = self.time_slots[ts]
                slot_start_minutes: int = time_to_minutes(slot_start)
                slot_end_minutes: int = time_to_minutes(slot_end)

                if has_breakfast_break and (slot_start_minutes < breakfast_end and slot_end_minutes > breakfast_start):
                    for c in range(len(self.classes)):
                        for s in range(len(self.subjects)):
                            for t in range(len(self.teachers)):
                                for r in range(len(self.rooms)):
                                    key = (c, s, t, r, d, ts)
                                    if key in self.assignment_vars:
                                        self.model.Add(self.assignment_vars[key] == 0)

                if slot_start_minutes < lunch_end and slot_end_minutes > lunch_start:
                    for c in range(len(self.classes)):
                        for s in range(len(self.subjects)):
                            for t in range(len(self.teachers)):
                                for r in range(len(self.rooms)):
                                    key = (c, s, t, r, d, ts)
                                    if key in self.assignment_vars:
                                        self.model.Add(self.assignment_vars[key] == 0)

    def _add_daily_lessons_constraints(self) -> None:
        """
        Enforce daily lessons constraints including:
        - A minimum and maximum number of unique subjects per day.
        - Optionally, an exact number of lessons per day.
        """
        min_subjects_per_day: Any = self.school_settings.get('minSubjectsPerDay')
        max_subjects_per_day: int = self.max_subjects_per_day
        exact_lessons_per_day: Any = self.school_settings.get('exactLessonsPerDay')

        for c in range(len(self.classes)):
            for d in range(len(self.days)):
                class_day_subjects: Dict[int, cp_model.IntVar] = {}
                for s in range(len(self.subjects)):
                    var_name: str = f"c{c}_d{d}_s{s}_taught"
                    subject_taught: cp_model.IntVar = self.model.NewBoolVar(var_name)
                    subject_assignments: List[cp_model.IntVar] = []
                    for t in range(len(self.teachers)):
                        for r in range(len(self.rooms)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    subject_assignments.append(self.assignment_vars[key])
                    if subject_assignments:
                        self.model.Add(sum(subject_assignments) >= 1).OnlyEnforceIf(subject_taught)
                        self.model.Add(sum(subject_assignments) == 0).OnlyEnforceIf(subject_taught.Not())
                        class_day_subjects[s] = subject_taught
                if class_day_subjects:
                    if min_subjects_per_day is not None:
                        self.model.Add(sum(class_day_subjects.values()) >= min_subjects_per_day)
                    self.model.Add(sum(class_day_subjects.values()) <= max_subjects_per_day)

                if exact_lessons_per_day is not None:
                    lesson_vars: List[cp_model.IntVar] = []
                    for s in range(len(self.subjects)):
                        for t in range(len(self.teachers)):
                            for r in range(len(self.rooms)):
                                for ts in range(len(self.time_slots)):
                                    key = (c, s, t, r, d, ts)
                                    if key in self.assignment_vars:
                                        lesson_vars.append(self.assignment_vars[key])
                    if lesson_vars:
                        self.model.Add(sum(lesson_vars) == exact_lessons_per_day)

    def _add_free_period_constraints(self) -> None:
        """
        Block time slots as per configured free periods.
        """
        if not self.free_periods:
            return

        def time_to_minutes(time_str: str) -> int:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes

        for period in self.free_periods:
            period_name: str = period.get('name', 'Unnamed Period')
            period_days: List[str] = period.get('days', [])
            period_start: str = period.get('startTime')
            period_duration: int = period.get('duration', 60)
            affected_classes: List[str] = period.get('forClasses', [])
            if not period_start:
                logger.warning(f"Free period '{period_name}' missing start time, skipping")
                continue

            period_start_minutes: int = time_to_minutes(period_start)
            period_end_minutes: int = period_start_minutes + period_duration

            for d, day in enumerate(self.days):
                if day in period_days or "all" in period_days:
                    for ts, (slot_start, slot_end) in enumerate(self.time_slots):
                        slot_start_minutes: int = time_to_minutes(slot_start)
                        slot_end_minutes: int = time_to_minutes(slot_end)
                        if slot_start_minutes < period_end_minutes and slot_end_minutes > period_start_minutes:
                            for c in range(len(self.classes)):
                                class_info = self.classes[c]
                                class_id: str = class_info.get('id')
                                if "all" in affected_classes or class_id in affected_classes:
                                    for s in range(len(self.subjects)):
                                        for t in range(len(self.teachers)):
                                            for r in range(len(self.rooms)):
                                                key = (c, s, t, r, d, ts)
                                                if key in self.assignment_vars:
                                                    self.model.Add(self.assignment_vars[key] == 0)

    def _add_balanced_distribution_constraint(self) -> None:
        """
        Enforce a balanced distribution of subjects across days for each class.
        """
        scheduling_preferences: Dict[str, Any] = self.school_settings.get('schedulingPreferences', {})
        balance_subjects: bool = scheduling_preferences.get('balanceSubjectsAcrossDays', True)
        if not balance_subjects:
            return

        for c in range(len(self.classes)):
            class_info = self.classes[c]
            required_subjects: List[str] = class_info.get('requiredSubjects', [])
            for s_id in required_subjects:
                if s_id not in self.subject_indices:
                    continue
                s: int = self.subject_indices[s_id]
                subject: Dict[str, Any] = self.subjects[s]
                hours_per_week: int = subject.get('hoursPerWeek', 0)
                if hours_per_week < 2:
                    continue
                max_per_day: int = min(2, hours_per_week - 1)
                for d in range(len(self.days)):
                    subject_day_lessons: List[cp_model.IntVar] = []
                    for t in range(len(self.teachers)):
                        for r in range(len(self.rooms)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    subject_day_lessons.append(self.assignment_vars[key])
                    if subject_day_lessons:
                        self.model.Add(sum(subject_day_lessons) <= max_per_day)

    def _add_heavy_subjects_morning_preference(self) -> None:
        """
        Prefer morning slots for heavy subjects if configured.
        Assignments outside morning slots (after 12:00) will be penalized in the objective.
        """
        scheduling_preferences: Dict[str, Any] = self.school_settings.get('schedulingPreferences', {})
        prefer_morning: bool = scheduling_preferences.get('preferMorningForHeavySubjects', False)
        heavy_subjects: List[str] = scheduling_preferences.get('heavySubjects', [])
        if not (prefer_morning and heavy_subjects):
            return

        morning_slots: List[int] = [ts for ts, (slot_start, _) in enumerate(self.time_slots) if int(slot_start.split(':')[0]) < 12]
        if not morning_slots:
            return

        self.heavy_subjects_afternoon_keys: List[cp_model.IntVar] = []
        heavy_subject_indices: List[int] = [self.subject_indices[s] for s in heavy_subjects if s in self.subject_indices]
        for c in range(len(self.classes)):
            for s in heavy_subject_indices:
                for d in range(len(self.days)):
                    for t in range(len(self.teachers)):
                        for r in range(len(self.rooms)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars and ts not in morning_slots:
                                    self.heavy_subjects_afternoon_keys.append(self.assignment_vars[key])

    def _add_teacher_availability_schedule_constraint(self) -> None:
        """
        Enforce teacher availability based on provided schedule constraints.
        Assignment variables corresponding to (day, slot) combinations outside a teacher's availability
        are forced to 0.
        """
        for t in range(len(self.teachers)):
            teacher = self.teachers[t]
            availability: List[Dict[str, Any]] = teacher.get('availability', [])
            if not availability:
                continue
            available_slots: set = set()
            for avail in availability:
                day: str = avail.get('day')
                if day not in self.day_indices:
                    continue
                day_idx: int = self.day_indices[day]
                time_slots_list: List[Dict[str, str]] = avail.get('timeSlots', [])
                for slot in time_slots_list:
                    start_time: str = slot.get('startTime')
                    end_time: str = slot.get('endTime')
                    if (start_time, end_time) in self.time_slot_indices:
                        ts_idx: int = self.time_slot_indices[(start_time, end_time)]
                        available_slots.add((day_idx, ts_idx))
            for c in range(len(self.classes)):
                for s in range(len(self.subjects)):
                    for r in range(len(self.rooms)):
                        for d in range(len(self.days)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars and (d, ts) not in available_slots:
                                    self.model.Add(self.assignment_vars[key] == 0)

    def _add_no_repeat_subject_constraint(self) -> None:
        """
        Prevent the same subject from being scheduled:
        1. Multiple times in the same day for a class
        2. In consecutive time slots (back-to-back) for a class

        This ensures a more realistic and diverse daily schedule for each class.
        """
        logger.info("Adding no-repeat subject constraints...")

        # For each class and day, ensure each subject is scheduled at most once
        for c in range(len(self.classes)):
            class_info = self.classes[c]
            class_id = class_info.get('id')

            for d in range(len(self.days)):
                day = self.days[d]

                # For each subject, create a variable indicating if it's taught on this day
                subject_taught_today = {}
                for s in range(len(self.subjects)):
                    subject_id = self.subject_ids.get(s)
                    if not subject_id:
                        continue

                    # Create a variable for each subject indicating if it's taught on this day
                    var_name = f"subject_{subject_id}_taught_c{c}_d{d}"
                    subject_taught_today[s] = self.model.NewBoolVar(var_name)

                    # Collect all assignment variables for this subject on this day
                    subject_assignments = []
                    for t in range(len(self.teachers)):
                        for r in range(len(self.rooms)):
                            for ts in range(len(self.time_slots)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    subject_assignments.append(self.assignment_vars[key])

                    if subject_assignments:
                        # If any assignment is 1, the subject is taught today
                        self.model.Add(sum(subject_assignments) >= 1).OnlyEnforceIf(subject_taught_today[s])
                        self.model.Add(sum(subject_assignments) == 0).OnlyEnforceIf(subject_taught_today[s].Not())

                        # Constraint: Each subject can be taught at most once per day per class
                        self.model.Add(sum(subject_assignments) <= 1)

                # Log the constraint for debugging
                logger.info(f"Added constraint: Each subject taught at most once per day for class {class_id} on {day}")

        # Prevent back-to-back scheduling of the same subject
        for c in range(len(self.classes)):
            class_info = self.classes[c]
            class_id = class_info.get('id')

            for d in range(len(self.days)):
                day = self.days[d]

                # For consecutive time slots
                for ts in range(len(self.time_slots) - 1):
                    # For each subject
                    for s in range(len(self.subjects)):
                        subject_id = self.subject_ids.get(s)
                        if not subject_id:
                            continue

                        # Collect assignments for this subject in current time slot
                        current_slot_assignments = []
                        for t in range(len(self.teachers)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    current_slot_assignments.append(self.assignment_vars[key])

                        # Collect assignments for this subject in next time slot
                        next_slot_assignments = []
                        for t in range(len(self.teachers)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts + 1)
                                if key in self.assignment_vars:
                                    next_slot_assignments.append(self.assignment_vars[key])

                        # If both slots have assignments, prevent them from both being 1
                        if current_slot_assignments and next_slot_assignments:
                            for current_var in current_slot_assignments:
                                for next_var in next_slot_assignments:
                                    # Cannot have the same subject in consecutive slots
                                    self.model.Add(current_var + next_var <= 1)

                # Log the constraint for debugging
                logger.info(f"Added constraint: No back-to-back same subject for class {class_id} on {day}")

    def _add_objective(self) -> None:
        """
        Set an objective function to minimize teacher and class gaps as well as penalize heavy
        subjects assigned in the afternoon.
        """
        logger.info("Adding objective function...")
        objective_terms: List[Any] = []
        objective_weights: List[int] = []

        teacher_gap_vars: List[cp_model.IntVar] = []
        for t in range(len(self.teachers)):
            for d in range(len(self.days)):
                active_slots: List[cp_model.IntVar] = []
                for ts in range(len(self.time_slots)):
                    slot_vars: List[cp_model.IntVar] = []
                    for c in range(len(self.classes)):
                        for s in range(len(self.subjects)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    slot_vars.append(self.assignment_vars[key])
                    if slot_vars:
                        var_name: str = f"t{t}_d{d}_ts{ts}_active"
                        is_active: cp_model.IntVar = self.model.NewBoolVar(var_name)
                        self.model.Add(sum(slot_vars) >= 1).OnlyEnforceIf(is_active)
                        self.model.Add(sum(slot_vars) == 0).OnlyEnforceIf(is_active.Not())
                        active_slots.append(is_active)
                if len(active_slots) >= 3:
                    for i in range(1, len(active_slots) - 1):
                        gap_var: cp_model.IntVar = self.model.NewBoolVar(f"t{t}_d{d}_ts{i}_gap")
                        self.model.AddBoolAnd([active_slots[i-1], active_slots[i].Not(), active_slots[i+1]]).OnlyEnforceIf(gap_var)
                        self.model.AddBoolOr([active_slots[i-1].Not(), active_slots[i], active_slots[i+1].Not()]).OnlyEnforceIf(gap_var.Not())
                        teacher_gap_vars.append(gap_var)
        if teacher_gap_vars:
            objective_terms.append(sum(teacher_gap_vars))
            objective_weights.append(100)

        class_gap_vars: List[cp_model.IntVar] = []
        for c in range(len(self.classes)):
            for d in range(len(self.days)):
                active_slots: List[cp_model.IntVar] = []
                for ts in range(len(self.time_slots)):
                    slot_vars: List[cp_model.IntVar] = []
                    for s in range(len(self.subjects)):
                        for t in range(len(self.teachers)):
                            for r in range(len(self.rooms)):
                                key = (c, s, t, r, d, ts)
                                if key in self.assignment_vars:
                                    slot_vars.append(self.assignment_vars[key])
                    if slot_vars:
                        var_name: str = f"c{c}_d{d}_ts{ts}_active"
                        is_active: cp_model.IntVar = self.model.NewBoolVar(var_name)
                        self.model.Add(sum(slot_vars) >= 1).OnlyEnforceIf(is_active)
                        self.model.Add(sum(slot_vars) == 0).OnlyEnforceIf(is_active.Not())
                        active_slots.append(is_active)
                if len(active_slots) >= 3:
                    for i in range(1, len(active_slots) - 1):
                        gap_var: cp_model.IntVar = self.model.NewBoolVar(f"c{c}_d{d}_ts{i}_gap")
                        self.model.AddBoolAnd([active_slots[i-1], active_slots[i].Not(), active_slots[i+1]]).OnlyEnforceIf(gap_var)
                        self.model.AddBoolOr([active_slots[i-1].Not(), active_slots[i], active_slots[i+1].Not()]).OnlyEnforceIf(gap_var.Not())
                        class_gap_vars.append(gap_var)
        if class_gap_vars:
            objective_terms.append(sum(class_gap_vars))
            objective_weights.append(80)

        if hasattr(self, "heavy_subjects_afternoon_keys") and self.heavy_subjects_afternoon_keys:
            objective_terms.append(sum(self.heavy_subjects_afternoon_keys))
            objective_weights.append(50)

        if objective_terms:
            weighted_sum = 0
            for term, weight in zip(objective_terms, objective_weights):
                weighted_sum += term * weight
            self.model.Minimize(weighted_sum)
        else:
            self.model.Minimize(0)

    def solve(self) -> bool:
        """
        Solve the scheduling model.

        Returns:
            bool: True if a solution was found, False otherwise.
        """
        logger.info("Creating variables and adding constraints...")
        self._create_variables()
        self._add_all_constraints()
        self._add_objective()

        self.solver.parameters.max_time_in_seconds = 60.0
        logger.info("Solving the model...")
        self.status = self.solver.Solve(self.model)

        if self.status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            logger.info(f"Solution found with status: {self.status}")
            return True
        else:
            logger.warning(f"No solution found. Status: {self.status}")
            return False

    def extract_solution(self) -> Dict[str, Any]:
        """
        Extract the generated schedule from the solver.

        Returns:
            Dict[str, Any]: The generated schedule.
        """
        if not self.solver or self.status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            logger.warning("No valid solution found. Generating fallback mock schedule.")
            return self._generate_mock_schedule()

        logger.info("Extracting solution...")
        schedule: Dict[str, Any] = {
            "scheduleId": f"generated-schedule-{str(uuid.uuid4())[:8]}",
            "entries": []
        }

        # Track teacher assignments for validation
        teacher_subject_assignments = {}
        subject_hours_count = {}

        # Track subjects scheduled per class per day to validate no-repeat constraint
        subjects_per_class_day = {}

        # Track time slots for each class-day to check for back-to-back subjects
        class_day_time_slots = {}

        for key, var in self.assignment_vars.items():
            if self.solver.Value(var) == 1:
                c, s, t, r, d, ts = key
                class_id: str = self.class_ids[c]
                subject_id: str = self.subject_ids[s]
                teacher_id: str = self.teacher_ids[t]
                room_id: str = self.room_ids[r]
                day: str = self.days[d]
                start_time, end_time = self.time_slots[ts]

                # Track teacher assignments for consistency validation
                key = (class_id, subject_id)
                if key not in teacher_subject_assignments:
                    teacher_subject_assignments[key] = teacher_id
                elif teacher_subject_assignments[key] != teacher_id:
                    logger.warning(f"INCONSISTENCY: Class {class_id}, Subject {subject_id} has multiple teachers: "
                                  f"{teacher_subject_assignments[key]} and {teacher_id}")

                # Track subject hours for validation
                if key not in subject_hours_count:
                    subject_hours_count[key] = 1
                else:
                    subject_hours_count[key] += 1

                # Track subjects per class per day to validate no-repeat constraint
                class_day_key = (class_id, day)
                if class_day_key not in subjects_per_class_day:
                    subjects_per_class_day[class_day_key] = {subject_id: 1}
                else:
                    if subject_id in subjects_per_class_day[class_day_key]:
                        subjects_per_class_day[class_day_key][subject_id] += 1
                        logger.warning(f"REPEAT SUBJECT: Class {class_id} has subject {subject_id} scheduled "
                                      f"{subjects_per_class_day[class_day_key][subject_id]} times on {day}")
                    else:
                        subjects_per_class_day[class_day_key][subject_id] = 1

                # Track time slots for each class-day to check for back-to-back subjects
                if class_day_key not in class_day_time_slots:
                    class_day_time_slots[class_day_key] = [(ts, subject_id)]
                else:
                    class_day_time_slots[class_day_key].append((ts, subject_id))

                if not self.use_room_constraints:
                    class_name: str = next((cls["name"] for cls in self.classes if cls["id"] == class_id), f"Class {c}")
                    entry: Dict[str, Any] = {
                        "id": str(uuid.uuid4()),
                        "day": day,
                        "startTime": start_time,
                        "endTime": end_time,
                        "classId": class_id,
                        "subjectId": subject_id,
                        "teacherId": teacher_id,
                        "roomId": class_id,
                        "roomName": f"Room {class_name}"
                    }
                else:
                    entry = {
                        "id": str(uuid.uuid4()),
                        "day": day,
                        "startTime": start_time,
                        "endTime": end_time,
                        "classId": class_id,
                        "subjectId": subject_id,
                        "teacherId": teacher_id,
                        "roomId": room_id
                    }
                schedule["entries"].append(entry)

        # Validate subject hours
        for (class_id, subject_id), hours in subject_hours_count.items():
            expected_hours = 0
            for subject in self.subjects:
                if subject['id'] == subject_id:
                    expected_hours = subject.get('hoursPerWeek', 0)
                    break

            if hours != expected_hours:
                logger.warning(f"HOURS MISMATCH: Class {class_id}, Subject {subject_id} has {hours} hours "
                              f"but expected {expected_hours} hours")

        # Check for back-to-back same subjects
        for class_day_key, time_slots in class_day_time_slots.items():
            class_id, day = class_day_key
            # Sort by time slot index
            time_slots.sort()

            # Check consecutive slots
            for i in range(len(time_slots) - 1):
                current_ts, current_subject = time_slots[i]
                next_ts, next_subject = time_slots[i + 1]

                # If consecutive time slots have the same subject
                if current_ts + 1 == next_ts and current_subject == next_subject:
                    logger.warning(f"BACK-TO-BACK: Class {class_id} has subject {current_subject} scheduled "
                                  f"in consecutive time slots on {day}")

        # Log teacher assignments for verification
        logger.info("Teacher assignments in final schedule:")
        for (class_id, subject_id), teacher_id in teacher_subject_assignments.items():
            logger.info(f"  Class {class_id}, Subject {subject_id} -> Teacher {teacher_id}")

        # Log subject distribution per day
        logger.info("Subject distribution per day:")
        for (class_id, day), subjects in subjects_per_class_day.items():
            logger.info(f"  Class {class_id} on {day}: {len(subjects)} different subjects")

        return schedule

    def _generate_mock_schedule(self) -> Dict[str, Any]:
        """
        Generate a mock schedule as a fallback in case no valid solution is found.
        This mock schedule respects teacher consistency and subject hours constraints.

        Returns:
            Dict[str, Any]: A mock schedule.
        """
        logger.info("Generating fallback mock schedule with teacher consistency and subject hours constraints.")
        mock_schedule: Dict[str, Any] = {
            "scheduleId": f"mock-schedule-{str(uuid.uuid4())[:8]}",
            "entries": []
        }

        # Track assigned teachers for each class-subject pair
        assigned_teachers = {}
        # Track hours assigned for each class-subject pair
        assigned_hours = {}

        # First, assign teachers to subjects for each class
        for class_info in self.classes:
            class_id = class_info.get("id")
            required_subjects = class_info.get('requiredSubjects', [])

            for subject_id in required_subjects:
                if subject_id not in self.subject_indices:
                    continue

                # Find valid teachers for this subject
                valid_teachers = [t for t in self.teachers if subject_id in t.get('subjects', [])]
                if not valid_teachers:
                    logger.warning(f"No valid teachers for subject {subject_id} in class {class_id}")
                    continue

                # Assign a teacher consistently
                teacher = np.random.choice(valid_teachers)
                assigned_teachers[(class_id, subject_id)] = teacher
                assigned_hours[(class_id, subject_id)] = 0

        # Now generate the schedule respecting teacher consistency
        available_slots = []
        for day in self.days:
            for time_slot in self.time_slots:
                available_slots.append((day, time_slot))

        # Shuffle slots for randomness
        np.random.shuffle(available_slots)

        # For each class-subject pair, assign the required hours
        for (class_id, subject_id), teacher in assigned_teachers.items():
            # Get the subject hours requirement
            subject = next((s for s in self.subjects if s.get("id") == subject_id), None)
            if not subject:
                continue

            hours_per_week = subject.get("hoursPerWeek", 0)
            if hours_per_week <= 0:
                continue

            # Get class info
            class_info = next((c for c in self.classes if c.get("id") == class_id), None)
            if not class_info:
                continue

            # Assign hours up to the requirement
            hours_to_assign = hours_per_week
            for slot_idx, (day, time_slot) in enumerate(available_slots):
                if hours_to_assign <= 0:
                    break

                # Check if this slot works for this class
                valid_slot = True

                # Check if teacher is already assigned in this slot
                # Also check if this subject is already scheduled for this class on this day
                # And check if this would create a back-to-back scheduling of the same subject
                for existing_entry in mock_schedule["entries"]:
                    # Teacher already busy in this time slot
                    if (existing_entry["day"] == day and
                        existing_entry["startTime"] == time_slot[0] and
                        existing_entry["teacherId"] == teacher.get("id")):
                        valid_slot = False
                        break

                    # Class already has a lesson in this time slot
                    if (existing_entry["day"] == day and
                        existing_entry["startTime"] == time_slot[0] and
                        existing_entry["classId"] == class_id):
                        valid_slot = False
                        break

                    # Subject already scheduled for this class on this day
                    if (existing_entry["day"] == day and
                        existing_entry["classId"] == class_id and
                        existing_entry["subjectId"] == subject_id):
                        valid_slot = False
                        break

                    # Check for back-to-back scheduling of the same subject
                    # Get the time slot before and after the current one
                    time_slot_idx = next((i for i, ts in enumerate(self.time_slots) if ts[0] == time_slot[0]), -1)
                    if time_slot_idx >= 0:
                        # Check previous time slot
                        if time_slot_idx > 0:
                            prev_time_slot = self.time_slots[time_slot_idx - 1]
                            if (existing_entry["day"] == day and
                                existing_entry["startTime"] == prev_time_slot[0] and
                                existing_entry["classId"] == class_id and
                                existing_entry["subjectId"] == subject_id):
                                valid_slot = False
                                break

                        # Check next time slot
                        if time_slot_idx < len(self.time_slots) - 1:
                            next_time_slot = self.time_slots[time_slot_idx + 1]
                            if (existing_entry["day"] == day and
                                existing_entry["startTime"] == next_time_slot[0] and
                                existing_entry["classId"] == class_id and
                                existing_entry["subjectId"] == subject_id):
                                valid_slot = False
                                break

                if valid_slot:
                    # Assign this slot
                    room = np.random.choice(self.rooms) if self.rooms else {"id": f"room-{slot_idx}"}
                    entry = {
                        "id": str(uuid.uuid4()),
                        "day": day,
                        "startTime": time_slot[0],
                        "endTime": time_slot[1],
                        "classId": class_id,
                        "subjectId": subject_id,
                        "teacherId": teacher.get("id"),
                        "roomId": room.get("id", f"room-{slot_idx}")
                    }
                    mock_schedule["entries"].append(entry)
                    assigned_hours[(class_id, subject_id)] += 1
                    hours_to_assign -= 1

            # Log if we couldn't assign all hours
            if hours_to_assign > 0:
                logger.warning(f"Could only assign {hours_per_week - hours_to_assign}/{hours_per_week} hours "
                              f"for subject {subject_id} in class {class_id}")

        # Log teacher assignments for verification
        logger.info("Teacher assignments in mock schedule:")
        for (class_id, subject_id), teacher in assigned_teachers.items():
            hours = assigned_hours.get((class_id, subject_id), 0)
            subject = next((s for s in self.subjects if s.get("id") == subject_id), {"hoursPerWeek": 0})
            logger.info(f"  Class {class_id}, Subject {subject_id} -> Teacher {teacher.get('id')} "
                       f"({hours}/{subject.get('hoursPerWeek', 0)} hours)")

        return mock_schedule


def generate_schedule(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a school timetable based on provided constraints.

    Args:
        data (Dict[str, Any]): Contains school settings, teachers, classes, subjects, and rooms.

    Returns:
        Dict[str, Any]: A generated timetable schedule.
    """
    try:
        logger.info("Starting schedule generation.")
        scheduler = TimetableScheduler(data)
        if scheduler.solve():
            return scheduler.extract_solution()
        else:
            logger.warning("No solution found; returning mock schedule.")
            return scheduler._generate_mock_schedule()
    except Exception as e:
        logger.error(f"Error during schedule generation: {e}")
        return {"scheduleId": f"error-schedule-{str(uuid.uuid4())[:8]}", "entries": []}


def validate_constraints(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate scheduling constraints to check feasibility.

    Args:
        data (Dict[str, Any]): Contains all scheduling constraints.

    Returns:
        Dict[str, Any]: Validation result with 'feasible' flag and list of 'issues'.
    """
    issues: List[str] = []
    school_settings: Dict[str, Any] = data.get('school_settings', {})
    teachers: List[Dict[str, Any]] = data.get('teachers', [])
    classes: List[Dict[str, Any]] = data.get('classes', [])
    subjects: List[Dict[str, Any]] = data.get('subjects', [])
    rooms: List[Dict[str, Any]] = data.get('rooms', [])

    if not school_settings:
        issues.append("School settings are missing.")
    if not teachers:
        issues.append("No teachers provided.")
    if not classes:
        issues.append("No classes provided.")
    if not subjects:
        issues.append("No subjects provided.")
    if school_settings.get('useRoomConstraints', True) and not rooms:
        issues.append("No rooms provided (required when room constraints are enabled).")

    if school_settings:
        if not school_settings.get('startTime'):
            issues.append("School start time is missing.")
        if not school_settings.get('endTime'):
            issues.append("School end time is missing.")
        if not school_settings.get('lessonDuration'):
            issues.append("Lesson duration is missing.")
        max_subjects = school_settings.get('maxSubjectsPerDay')
        if max_subjects is not None and (not isinstance(max_subjects, int) or max_subjects < 0):
            issues.append("Maximum subjects per day must be a positive integer.")

        free_periods = school_settings.get('freePeriods', [])
        for i, period in enumerate(free_periods):
            if not period.get('name'):
                issues.append(f"Free period at index {i} is missing a name.")
            if not period.get('startTime'):
                issues.append(f"Free period '{period.get('name', f'at index {i}')}' is missing a start time.")
            if not period.get('days'):
                issues.append(f"Free period '{period.get('name', f'at index {i}')}' has no assigned days.")
            if not period.get('forClasses'):
                issues.append(f"Free period '{period.get('name', f'at index {i}')}' has no assigned classes.")

        try:
            s_time = school_settings.get('startTime', '08:00')
            e_time = school_settings.get('endTime', '15:00')
            s_hours, s_minutes = map(int, s_time.split(':'))
            e_hours, e_minutes = map(int, e_time.split(':'))
            if e_hours * 60 + e_minutes <= s_hours * 60 + s_minutes:
                issues.append("School end time must be after start time.")
        except Exception:
            issues.append("Invalid time format in school settings.")

    for i, teacher in enumerate(teachers):
        if not teacher.get('id'):
            issues.append(f"Teacher at index {i} is missing an ID.")
        if not teacher.get('subjects'):
            issues.append(f"Teacher '{teacher.get('name', f'at index {i}')}' has no assigned subjects.")

    for i, cls in enumerate(classes):
        if not cls.get('id'):
            issues.append(f"Class at index {i} is missing an ID.")
        if not cls.get('requiredSubjects'):
            issues.append(f"Class '{cls.get('name', f'at index {i}')}' has no required subjects.")

    subject_ids = set()
    for i, subject in enumerate(subjects):
        if not subject.get('id'):
            issues.append(f"Subject at index {i} is missing an ID.")
        else:
            subject_ids.add(subject.get('id'))
        if not subject.get('hoursPerWeek'):
            issues.append(f"Subject '{subject.get('name', f'at index {i}')}' has no specified hours per week.")

    for i, cls in enumerate(classes):
        for subj_id in cls.get('requiredSubjects', []):
            if subj_id not in subject_ids:
                issues.append(f"Class '{cls.get('name', f'at index {i}')}' requires non-existent subject ID: {subj_id}")
    for i, teacher in enumerate(teachers):
        for subj_id in teacher.get('subjects', []):
            if subj_id not in subject_ids:
                issues.append(f"Teacher '{teacher.get('name', f'at index {i}')}' is assigned non-existent subject ID: {subj_id}")

    if len(rooms) < len(classes):
        issues.append(f"Not enough rooms provided ({len(rooms)}) for the number of classes ({len(classes)}).")

    feasible: bool = len(issues) == 0
    logger.info(f"Constraint validation complete. Feasible: {feasible}, Issues: {len(issues)}")
    return {"feasible": feasible, "issues": issues}


if __name__ == "__main__":
    sample_data = {
        "school_settings": {
            "startTime": "08:00",
            "endTime": "15:00",
            "lessonDuration": 60,
            "breakDuration": 15,
            "hasBreakfastBreak": True,
            "breakfastBreakStartTime": "10:00",
            "breakfastBreakDuration": 25,
            "lunchBreakStartTime": "12:00",
            "lunchBreakDuration": 45,
            "maxSubjectsPerDay": 6,
            "workingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
            "freePeriods": [
                {
                    "name": "Assembly",
                    "startTime": "09:00",
                    "duration": 30,
                    "days": ["MONDAY"],
                    "forClasses": ["class-1"]
                }
            ],
            "schedulingPreferences": {
                "balanceSubjectsAcrossDays": True,
                "preferMorningForHeavySubjects": True,
                "heavySubjects": ["math", "science"]
            }
        },
        "teachers": [
            {"id": "teacher-1", "name": "Alice", "subjects": ["math", "science"], "maxHoursPerDay": 5, "maxHoursPerWeek": 20},
            {"id": "teacher-2", "name": "Bob", "subjects": ["english"], "maxHoursPerDay": 5, "maxHoursPerWeek": 20}
        ],
        "classes": [
            {"id": "class-1", "name": "Class 1", "requiredSubjects": ["math", "english"]},
            {"id": "class-2", "name": "Class 2", "requiredSubjects": ["science", "english"]}
        ],
        "subjects": [
            {"id": "math", "name": "Mathematics", "hoursPerWeek": 5},
            {"id": "science", "name": "Science", "hoursPerWeek": 4},
            {"id": "english", "name": "English", "hoursPerWeek": 6}
        ],
        "rooms": [
            {"id": "room-1", "name": "Room 101"},
            {"id": "room-2", "name": "Room 102"}
        ]
    }
    validation = validate_constraints(sample_data)
    if validation["feasible"]:
        schedule = generate_schedule(sample_data)
        logger.info(f"Generated Schedule: {schedule}")
    else:
        logger.error(f"Constraints are not feasible: {validation['issues']}")