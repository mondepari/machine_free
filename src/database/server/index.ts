// import { isDesktop } from '/@/const/version';
import { DBAdaptor } from '../core/db-adaptor';
// import { getDBInstance } from '../core/web-server';

// Создаем и экспортируем экземпляр адаптера
export const serverDB = new DBAdaptor();
// export const serverDB = getDBInstance();
