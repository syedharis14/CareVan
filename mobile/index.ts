import { registerRootComponent } from 'expo';
// The background location task must be registered before the app renders, so a
// cold start triggered by a background location event can still handle it.
import './src/location/locationTask';
import App from './App';

registerRootComponent(App);
