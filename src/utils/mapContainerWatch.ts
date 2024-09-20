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
function continueUpdateSize(map: Map, time: number, internal = 5) {
  const number = Math.ceil(time / internal);
  for (let i = 0; i < number; i++) {
    setTimeout(() => {
      map.updateSize();
    }, i * internal);
  }
}

export default mapContainerWatch;
