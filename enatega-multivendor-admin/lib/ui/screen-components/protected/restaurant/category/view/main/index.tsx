// Core
import { useContext, useState } from 'react';

// Prime React
import { FilterMatchMode } from 'primereact/api';

// Interface and Types

// Components
import Table from '@/lib/ui/useable-components/table';
import { CATEGORY_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/category-columns';

// Utilities and Data
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import { IActionMenuItem } from '@/lib/utils/interfaces/action-menu.interface';

//Toast
import { useQueryGQL } from '@/lib/hooks/useQueryQL';
import useToast from '@/lib/hooks/useToast';
import {
  ICategory,
  ICategoryByRestaurantResponse,
  ICategoryMainComponentsProps,
  IQueryResult,
  ISubCategoryResponse,
} from '@/lib/utils/interfaces';

// GraphQL
import {
  DELETE_CATEGORY,
  GET_CATEGORY_BY_RESTAURANT_ID,
} from '@/lib/api/graphql';
import { RestaurantLayoutContext } from '@/lib/context/restaurant/layout-restaurant.context';
import { generateDummyCategories } from '@/lib/utils/dummy';
import { useMutation } from '@apollo/client';
import CategoryTableHeader from '../header/table-header';
import { GET_SUBCATEGORIES } from '@/lib/api/graphql/queries/sub-categories';
import SubCategoriesPreiwModal from '../modal';

export default function CategoryMain({
  setIsAddCategoryVisible,
  setSubCategories,
  setCategory,
  setIsAddSubCategoriesVisible,
}: ICategoryMainComponentsProps) {
  // Context
  const {
    restaurantLayoutContextData,
    subCategoryParentId,
    isSubCategoryModalOpen,
    setIsSubCategoryModalOpen,
    setSubCategoryParentId,
  } = useContext(RestaurantLayoutContext);
  const restaurantId = restaurantLayoutContextData?.restaurantId || '';

  // Hooks
  const { showToast } = useToast();

  // State - Table
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ICategory[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: '' as string | null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Queries
  const { data, loading } = useQueryGQL(
    GET_CATEGORY_BY_RESTAURANT_ID,
    { id: restaurantId },
    {
      fetchPolicy: 'network-only',
      enabled: !!restaurantId,
      onCompleted: onFetchCategoriesByRestaurantCompleted,
      onError: onErrorFetchCategoriesByRestaurant,
    }
  ) as IQueryResult<ICategoryByRestaurantResponse | undefined, undefined>;

  const { data: subCategoriesData, loading: loadingSubCategories } =
    useQueryGQL(GET_SUBCATEGORIES, {
      fetchPolicy: 'network-only',
      onError: (error) => {
        showToast({
          type: 'error',
          title: 'Sub-Categories',
          message:
            error.clientErrors[0].message ||
            error.graphQLErrors[0].message ||
            'An error occured while fetching the sub-categories',
        });
      },
    }) as IQueryResult<ISubCategoryResponse | undefined, undefined>;

  //Mutation
  const [deleteCategory, { loading: mutationLoading }] = useMutation(
    DELETE_CATEGORY,
    {
      variables: {
        id: deleteId,
        restaurant: restaurantId,
      },
      refetchQueries: [
        {
          query: GET_CATEGORY_BY_RESTAURANT_ID,
          variables: { id: restaurantId },
        },
      ],
    }
  );

  // Handlers
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleCategoryRowClick = (id: string) => {
    setSubCategoryParentId(id);
    setIsSubCategoryModalOpen((prev) => !prev);
  };
  // Restaurant Profile Complete
  function onFetchCategoriesByRestaurantCompleted() {}
  // Restaurant Zone Info Error
  function onErrorFetchCategoriesByRestaurant() {
    showToast({
      type: 'error',
      title: 'Category Fetch',
      message: 'Categories fetch failed',
      duration: 2500,
    });
  }

  // Constants
  const menuItems: IActionMenuItem<ICategory>[] = [
    {
      label: 'Edit',
      command: (data?: ICategory) => {
        if (data) {
          setIsAddCategoryVisible(true);
          setCategory(data);
          if (subCategoriesData && !loadingSubCategories) {
            setSubCategories(
              subCategoriesData?.subCategories.filter(
                (sub_category) => sub_category.parentCategoryId === data._id
              )
            );
          }
        }
      },
    },
    {
      label: 'Delete',
      command: (data?: ICategory) => {
        if (data) {
          setDeleteId(data._id);
        }
      },
    },
    {
      label: 'View Sub-Categories',
      command: (data?: ICategory) => {
        if (data && data._id) {
          handleCategoryRowClick(data?._id);
        } else {
          showToast({
            type: 'error',
            title: 'View Sub-Categories',
            message:
              'An error occured while previewing the related sub-categories',
          });
        }
      },
    },
  ];
  return (
    <div className="p-3">
      {/* Sub-CTG Preview Modal  */}
      <SubCategoriesPreiwModal
        isSubCategoryModalOpen={isSubCategoryModalOpen}
        setIsSubCategoryModalOpen={setIsSubCategoryModalOpen}
        subCategoryParentId={subCategoryParentId}
      />
      <Table
        header={
          <CategoryTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        }
        data={
          data?.restaurant?.categories.slice().reverse() ||
          (loading ? generateDummyCategories() : [])
        }
        filters={filters}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        loading={loading && loadingSubCategories}
        columns={CATEGORY_TABLE_COLUMNS({
          menuItems,
          setIsAddSubCategoriesVisible,
        })}
      />
      <CustomDialog
        loading={mutationLoading}
        visible={!!deleteId}
        onHide={() => {
          setDeleteId('');
        }}
        onConfirm={() => {
          deleteCategory({
            variables: { id: deleteId },
            onCompleted: () => {
              showToast({
                type: 'success',
                title: 'Delete Category',
                message: 'Category has been deleted successfully.',
                duration: 3000,
              });
              setDeleteId('');
            },
            onError: (err) => {
              showToast({
                type: 'error',
                title: 'Delete Category',
                message:
                  err.message ||
                  err.clientErrors[0].message ||
                  err.networkError?.message ||
                  'An error occured while deleteing the category, please try again later.',
              });
            },
          });
        }}
        message="Are you sure you want to delete this category?"
      />
    </div>
  );
}
