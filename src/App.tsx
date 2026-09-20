import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from '@/context/AppContext';
import { Dashboard, WorkoutSchedule, CreateWorkout, FoodDetail, ExerciseDetail } from '@/screens/ScreensGroup1';
import { NutritionHub, Achievements, GoalProjection, Onboarding } from '@/screens/ScreensGroup2';
import { WorkoutDetail, WorkoutLibrary, MealPlanner, EditFood, BarcodeScanner } from '@/screens/ScreensGroup3';
import { Setup, AIFoodScanner, NotificationsScreen, ProfileScreen } from '@/screens/ScreensGroup4';
import { ProgressTracker, AICoach, WeeklyReport } from '@/screens/ScreensGroup5';
import { SettingsScreen, RecoveryHub, SupplementTracker } from '@/screens/ScreensGroup6';

function AppRoutes() {
  const { state } = useApp();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/onboarding" element={!state.user ? <Onboarding /> : <Navigate to="/dashboard" replace />} />
        <Route path="/setup" element={!state.user ? <Setup /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={state.user ? <Dashboard /> : <Navigate to="/onboarding" replace />} />
        <Route path="/workout" element={state.user ? <WorkoutDetail /> : <Navigate to="/onboarding" replace />} />
        <Route path="/workout/library" element={state.user ? <WorkoutLibrary /> : <Navigate to="/onboarding" replace />} />
        <Route path="/workout/schedule" element={state.user ? <WorkoutSchedule /> : <Navigate to="/onboarding" replace />} />
        <Route path="/workout/create" element={state.user ? <CreateWorkout /> : <Navigate to="/onboarding" replace />} />
        <Route path="/workout/exercise/:name" element={state.user ? <ExerciseDetail /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition" element={state.user ? <NutritionHub /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition/food/:name" element={state.user ? <FoodDetail /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition/edit/:meal/:index" element={state.user ? <EditFood /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition/planner" element={state.user ? <MealPlanner /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition/barcode" element={state.user ? <BarcodeScanner /> : <Navigate to="/onboarding" replace />} />
        <Route path="/nutrition/ai-scan" element={state.user ? <AIFoodScanner /> : <Navigate to="/onboarding" replace />} />
        <Route path="/achievements" element={state.user ? <Achievements /> : <Navigate to="/onboarding" replace />} />
        <Route path="/ai-coach" element={state.user ? <AICoach /> : <Navigate to="/onboarding" replace />} />
        <Route path="/recovery" element={state.user ? <RecoveryHub /> : <Navigate to="/onboarding" replace />} />
        <Route path="/progress" element={state.user ? <ProgressTracker /> : <Navigate to="/onboarding" replace />} />
        <Route path="/progress/projection" element={state.user ? <GoalProjection /> : <Navigate to="/onboarding" replace />} />
        <Route path="/supplements" element={state.user ? <SupplementTracker /> : <Navigate to="/onboarding" replace />} />
        <Route path="/settings" element={state.user ? <SettingsScreen /> : <Navigate to="/onboarding" replace />} />
        <Route path="/notifications" element={state.user ? <NotificationsScreen /> : <Navigate to="/onboarding" replace />} />
        <Route path="/weekly-report" element={state.user ? <WeeklyReport /> : <Navigate to="/onboarding" replace />} />
        <Route path="/profile" element={state.user ? <ProfileScreen /> : <Navigate to="/onboarding" replace />} />
        <Route path="/" element={<Navigate to={state.user ? "/dashboard" : "/onboarding"} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <AppRoutes />
      </div>
    </AppProvider>
  );
}
