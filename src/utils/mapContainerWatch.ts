import { Map } from 'ol';
import { watch } from 'vue';
import { useAppStore } from '../store/modules/app';

const appStore = useAppStore();

function mapContainerWatch(map: Map) {
  watch(
    () => {
      appStore.projectConfig!.menuSetting.collapsed;
    },
    (_newValue, _oldValue) => {
      continueUpdateSize(map, 400);
    },
    { deep: true },
  );
}
function continueUpdateSize(map: Map, time = 400) {
  let animationId: number;
  function updateSize() {
    map.updateSize();
    animationId = requestAnimationFrame(updateSize);
  }
  updateSize();
  setTimeout(() => {
    cancelAnimationFrame(animationId);
  }, time);
}

export default mapContainerWatch;
