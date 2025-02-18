import { Map } from 'ol';
import { isRef, onBeforeUnmount, Ref, watch } from 'vue';
import { useAppStore } from '../store/modules/app';

const appStore = useAppStore();

export function useMapContainerObserver(map: Map, container: HTMLElement | Ref<HTMLElement>) {
  let observer: ResizeObserver;
  const mapContainerObserver = (map: Map, container: HTMLElement | Ref<HTMLElement>) => {
    observer = new ResizeObserver((_entries) => {
      map.updateSize();
    });
    if (isRef(container)) {
      observer.observe(container.value);
    } else {
      observer.observe(container);
    }
  };

  mapContainerObserver(map, container);
  onBeforeUnmount(() => {
    if (isRef(container)) {
      observer.unobserve(container.value);
      observer.disconnect();
    } else {
      observer.unobserve(container);
      observer.disconnect();
    }
  });
}

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

  const updateSize = () => {
    map.updateSize();
    animationId = requestAnimationFrame(updateSize);
  };

  updateSize();
  setTimeout(() => {
    cancelAnimationFrame(animationId);
  }, time);
}

export default mapContainerWatch;
