import type { App } from 'vue';
import { Button } from './Button';
import { Button as AntButton } from 'ant-design-vue';
import Antd from 'ant-design-vue';

const compList = [AntButton.Group];

export function registerGlobComp(app: App) {
  compList.forEach((comp) => {
    app.component(comp.name || comp.displayName, comp);
  });

  app.use(Button).use(Antd);
}
