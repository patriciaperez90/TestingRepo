import { IExtendedOrder } from '@/lib/utils/interfaces';

export const ORDER_SUPER_ADMIN_COLUMNS = [
  {
    headerName: 'Order ID',
    propertyName: 'orderId',
  },
  {
    propertyName: 'itemsTitle',
    headerName: 'Items',
  },
  {
    headerName: 'Payment',
    propertyName: 'paymentMethod',
  },
  {
    headerName: 'Order Status',
    propertyName: 'orderStatus',
  },
  {
    headerName: 'Reason',
    propertyName: 'reason',
    body: (rowData: IExtendedOrder) => {
      if (!rowData.reason) {
        return <span>-</span>;
      }
      return <span>{rowData.reason}</span>;
    },
  },
  {
    headerName: 'Created At',
    propertyName: 'DateCreated',
    body: (rowData: IExtendedOrder) => {
      let date: string | number | Date =
        parseInt(rowData.DateCreated ? rowData.DateCreated : '1725455473000') *
        1000;
      if (date) {
        const newDate = new Date(date).toDateString();
        return <span className="text-center">{newDate}</span>;
      }
    },
  },
  {
    headerName: 'Delivery Address',
    propertyName: 'OrderdeliveryAddress',
  },
];
