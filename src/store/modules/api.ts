import { defineStore } from 'pinia';
import { OptionData } from '/@/api/point';

const defaultParams: OptionData = {
  lease_type: '',
  room_number: [],
  direction: [''],
  price_min: 0,
  price_max: 0,
};

export const useApiStore = defineStore({
  id: 'api',
  state: (): OptionData => ({
    lease_type: '',
    room_number: [],
    direction: [''],
    price_min: 0,
    price_max: 0,
  }),
  getters: {},
  actions: {
    resetFilterParams(optionItem: string | string[]) {
      if (typeof optionItem === 'string') {
        this.$state[optionItem] = defaultParams[optionItem];
      }
      if (Array.isArray(optionItem)) {
        optionItem.forEach((item) => {
          this.$state[item] = defaultParams[item];
        });
      }
    },
    //   更新过滤参数
    updateFilterParams(param: OptionData) {
      this.$patch((state) => {
        if (param.lease_type !== undefined) state.lease_type = param.lease_type;
        if (param.room_number !== undefined) state.room_number = param.room_number;
        if (param.direction !== undefined) state.direction = param.direction;
        if (param.price_min !== undefined) state.price_min = param.price_min;
        if (param.price_max !== undefined) state.price_max = param.price_max;
      });
    },
    //   获取过滤参数
    getFilterParams() {
      return {
        lease_type: this.lease_type,
        room_number: this.room_number,
        direction: this.direction,
        price_min: this.price_min,
        price_max: this.price_max,
      };
    },
  },
});
