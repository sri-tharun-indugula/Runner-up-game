import { Game } from '@/core/Game';
import { OrientationGuard } from '@/ui/OrientationGuard';

window.addEventListener('load', () => {
  OrientationGuard.get();
  new Game();
});
