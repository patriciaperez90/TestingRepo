// Core
import { useMutation } from '@apollo/client';
import { useState } from 'react';

// Prime React
import { FilterMatchMode } from 'primereact/api';

// Interface and Types
import {
  IZoneResponse,
  IZonesResponse,
  IActionMenuItem,
  IQueryResult,
  IZoneMainComponentsProps,
} from '@/lib/utils/interfaces';

// UI Components
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import RidersTableHeader from '../header/table-header';

// Constants and Interfaces
import { ZONE_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/zone-columns';

// Hooks
import { useQueryGQL } from '@/lib/hooks/useQueryQL';
import useToast from '@/lib/hooks/useToast';

// GraphQL and Utilities
import { DELETE_ZONE, GET_ZONES } from '@/lib/api/graphql';

// Data
import { generateDummyZones } from '@/lib/utils/dummy';

export default function ZoneMain({
  setIsAddZoneVisible,
  setZone,
}: IZoneMainComponentsProps) {
  // Hooks
  const { showToast } = useToast();

  // State - Table
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<IZoneResponse[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: '' as string | null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Query
  const { data, loading } = useQueryGQL(GET_ZONES, {
    fetchPolicy: 'cache-and-network',
  }) as IQueryResult<IZonesResponse | undefined, undefined>;

  //Mutation
  const [mutateDelete, { loading: mutationLoading }] = useMutation(
    DELETE_ZONE,
    {
      refetchQueries: [{ query: GET_ZONES }],
    }
  );

  // For global search
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const menuItems: IActionMenuItem<IZoneResponse>[] = [
    {
      label: 'Edit',
      command: (data?: IZoneResponse) => {
        if (data) {
          setIsAddZoneVisible(true);
          setZone(data); // Zone here
        }
      },
    },
    {
      label: 'Delete',
      command: (data?: IZoneResponse) => {
        if (data) {
          setDeleteId(data._id);
        }
      },
    },
  ];

  return (
    <div className="pt-5">
      <Table
        header={
          <RidersTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        }
        data={data?.zones || (loading ? generateDummyZones() : [])}
        filters={filters}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        loading={loading}
        columns={ZONE_TABLE_COLUMNS({ menuItems })}
      />
      <CustomDialog
        loading={mutationLoading}
        visible={!!deleteId}
        onHide={() => {
          setDeleteId('');
        }}
        onConfirm={() => {
          mutateDelete({
            variables: { id: deleteId },
            onCompleted: () => {
              showToast({
                type: 'success',
                title: 'Delete Zone',
                message: 'Zone has been deleted successfully',
                duration: 3000,
              });
              setDeleteId('');
            },
          });
        }}
        message="Are you sure you want to delete this item?"
      />
    </div>
  );
}
