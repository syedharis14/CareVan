import { createNavigationContainerRef } from '@react-navigation/native';
import { ParentStackParamList } from './types';

/** Lets the push-notification handler navigate without a component context. */
export const navigationRef = createNavigationContainerRef<ParentStackParamList>();

/** Deep-link a tapped notification to the child's live screen (parent role). */
export function openChild(studentId: string): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ChildDetail', { studentId });
  }
}
