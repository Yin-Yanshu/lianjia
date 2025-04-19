import { defHttp } from '/@/utils/http/axios';

export const getHouseDetailByHouseId = (uuid) => {
  return defHttp.get({
    url: `/common/house-detail/${uuid}`,
  });
};
