// Interfaces
import { IDropdownSelectItem } from '@/lib/utils/interfaces';
import { IWithDrawRequest } from '@/lib/utils/interfaces/withdraw-request.interface';

// Components
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';

// GraphQL
import {
  GET_ALL_WITHDRAW_REQUESTS,
  UPDATE_WITHDRAW_REQUEST,
} from '@/lib/api/graphql';

// Hooks
import { useMutation } from '@apollo/client';
import { useContext, useMemo, useState } from 'react';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faCircleXmark,
  faDashboard,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

// Contexts
import { ToastContext } from '@/lib/context/global/toast.context';
import { Tag } from 'primereact/tag';

export const WITHDRAW_REQUESTS_TABLE_COLUMNS = () => {
  // Toast
  const { showToast } = useContext(ToastContext);

  // States
  const [isChangingStatus, setIsChangingStatus] = useState({
    _id: '',
    bool: false,
  });

  // Mutation
  const [updateWithdrawReqStatus, { loading: status_change_loading }] =
    useMutation(UPDATE_WITHDRAW_REQUEST, {
      onError: (err) => {
        showToast({
          type: 'error',
          title: 'Update Withdraw Request',
          message: err?.cause?.message || 'Failed to update the request',
        });
        setIsChangingStatus({
          _id: '',
          bool: false,
        });
      },
      onCompleted: () => {
        showToast({
          type: 'success',
          title: 'Update Withdraw Request',
          message: 'The withdraw request has been updated successfully',
        });
        setIsChangingStatus({
          _id: '',
          bool: false,
        });
      },
      refetchQueries: [{ query: GET_ALL_WITHDRAW_REQUESTS }],
    });

  // Handle drop down change
  const handleDropDownChange = async (
    e: DropdownChangeEvent,
    rowData: IWithDrawRequest
  ) => {
    // temp console
    console.log(e.value.code);
    setIsChangingStatus({
      _id: rowData._id,
      bool: true,
    });
    await updateWithdrawReqStatus({
      variables: {
        id: rowData._id,
        status: e.value.code,
      },
    });
  };

  // Templates
  const valueTemplate = (option: IDropdownSelectItem) => {
    return (
      <Tag
        severity={findSeverity(option?.code)}
        value={option?.label}
        rounded
      />
    );
  };

  const itemTemplate = (option: IDropdownSelectItem) => {
    return (
      <div className="flex gap-2">
        <FontAwesomeIcon
          icon={
            option.code === 'CANCELLED'
              ? faCircleXmark
              : option.code === 'TRANSFERRED'
                ? faArrowsRotate
                : option.code === 'REQUESTED'
                  ? faPaperPlane
                  : faDashboard
          }
          color={option.code === 'CANCELLED' ? 'red' : 'black'}
        />
        <span>{option.label}</span>
      </div>
    );
  };
  // Status dropdown options
  const options: IDropdownSelectItem[] = useMemo(
    () => [
      {
        code: 'REQUESTED',
        label: 'Requested',
        body: () => <Tag value="Requested" severity="info" rounded />,
      },
      {
        code: 'TRANSFERRED',
        label: 'Transferred',
        body: () => <Tag value="Transferred" severity="success" rounded />,
      },
      {
        code: 'CANCELLED',
        label: 'Cancelled',
        body: () => <Tag value="Cancelled" severity="danger" rounded />,
      },
    ],
    []
  );

  // Find severity
  function findSeverity(code: string | undefined) {
    switch (code) {
      case 'REQUESTED':
        return 'info';
      case 'TRANSFERRED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'warning';
    }
  }

  const withdraw_requests_columns = useMemo(
    () => [
      {
        headerName: 'Request Id',
        propertyName: 'requestId',
      },
      {
        headerName: 'Rider',
        propertyName: 'rider.name',
      },
      {
        headerName: 'Amount',
        propertyName: 'requestAmount',
      },
      {
        headerName: 'Date',
        propertyName: 'requestTime',
        body: (rowData: IWithDrawRequest) => {
          return (
            <span>{new Date(rowData.requestTime).toLocaleDateString()}</span>
          );
        },
      },
      {
        headerName: 'Status',
        propertyName: 'status',
        body: (rowData: IWithDrawRequest) => (
          <Dropdown
            value={options?.find((option) => option?.code === rowData.status)}
            options={options}
            onChange={(e) => handleDropDownChange(e, rowData)}
            itemTemplate={itemTemplate}
            valueTemplate={valueTemplate}
            loading={
              isChangingStatus.bool &&
              status_change_loading &&
              isChangingStatus._id === rowData._id
            }
            className="border border-gray-200"
          />
        ),
      },
    ],
    []
  );
  return withdraw_requests_columns;
};
