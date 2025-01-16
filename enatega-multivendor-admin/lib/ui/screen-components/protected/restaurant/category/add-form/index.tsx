// Core
import { FieldArray, Form, Formik } from 'formik';

// Prime React
import { Sidebar } from 'primereact/sidebar';
import { Fieldset } from 'primereact/fieldset';

// Interface, Types & Schema
import { ICategoryForm } from '@/lib/utils/interfaces/forms';
import {
  ICategoryAddFormComponentProps,
  ISubCategory,
  ISubCategoryByParentIdResponse,
} from '@/lib/utils/interfaces';
import { CategorySchema } from '@/lib/utils/schema';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomTextField from '@/lib/ui/useable-components/input-field';
import TextIconClickable from '@/lib/ui/useable-components/text-icon-clickable';

// Utilities and Constants
import { CategoryErrors } from '@/lib/utils/constants';
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';

//Toast
import useToast from '@/lib/hooks/useToast';

//GraphQL
import {
  CREATE_CATEGORY,
  EDIT_CATEGORY,
  GET_CATEGORY_BY_RESTAURANT_ID,
} from '@/lib/api/graphql';
import { DELETE_SUB_CATEGORY } from '@/lib/api/graphql/mutations/sub-category';

// Contexts
import { RestaurantLayoutContext } from '@/lib/context/restaurant/layout-restaurant.context';

// Icons
import { faAdd, faTrash } from '@fortawesome/free-solid-svg-icons';

// Hooks
import { useMutation, useQuery } from '@apollo/client';
import { useContext, useEffect } from 'react';
import {
  GET_SUBCATEGORIES,
  GET_SUBCATEGORIES_BY_PARENT_ID,
} from '@/lib/api/graphql/queries/sub-categories';
import CustomLoader from '@/lib/ui/useable-components/custom-progress-indicator';

export default function CategoryAddForm({
  onHide,
  category,
  position = 'right',
  isAddCategoryVisible,
}: ICategoryAddFormComponentProps) {
  // Queries
  const {
    data: subCategories,
    loading: subCategoriesLoading,
    refetch: refetchSubCatrgories,
  } = useQuery<ISubCategoryByParentIdResponse>(GET_SUBCATEGORIES_BY_PARENT_ID, {
    variables: {
      parentCategoryId: category?._id,
    },
  });

  // StateS
  const initialValues: ICategoryForm = {
    _id: '',
    title: '',
    subCategories:
      subCategories?.subCategoriesByParentId.length && !subCategoriesLoading
        ? subCategories?.subCategoriesByParentId
        : [{ _id: '', title: '', parentCategoryId: '' }],
    ...category,
  };

  // Hooks
  const { showToast } = useToast();

  // Context
  const { restaurantLayoutContextData } = useContext(RestaurantLayoutContext);
  const restaurantId = restaurantLayoutContextData?.restaurantId || '';

  // Mutations
  const [deleteSubCategory, { loading: deleteSubCategoryLoading }] =
    useMutation(DELETE_SUB_CATEGORY, {
      refetchQueries: [
        {
          query: GET_SUBCATEGORIES_BY_PARENT_ID,
          variables: {
            parentCategoryId: category?._id,
          },
        },
      ],
      onCompleted: () => {
        showToast({
          type: 'success',
          title: 'Delete Sub-Category',
          message: 'Deleted the sub-category successfully',
        });
      },
      onError: (error) => {
        showToast({
          type: 'error',
          title: 'Delete Sub-Category',
          message:
            error.message ||
            error.clientErrors[0].message ||
            error.networkError?.message ||
            'Failed to delete the sub-category, please try again later.',
        });
      },
    });
  const [createCategory, { loading: mutationLoading }] = useMutation(
    category ? EDIT_CATEGORY : CREATE_CATEGORY,
    {
      refetchQueries: [
        {
          query: GET_CATEGORY_BY_RESTAURANT_ID,
          variables: { id: restaurantId },
        },
        {
          query: GET_SUBCATEGORIES,
        },
      ],
      onCompleted: () => {
        showToast({
          type: 'success',
          title: 'New Category',
          message: `Category has been ${category ? 'edited' : 'added'} successfully.`,
          duration: 3000,
        });
        onHide();
      },
      onError: (error) => {
        let message = '';
        try {
          message = error.graphQLErrors[0]?.message;
        } catch (err) {
          message = 'ActionFailedTryAgain';
        }
        showToast({
          type: 'error',
          title: 'New Category',
          message,
          duration: 3000,
        });
      },
    }
  );

  // Form Submission
  const handleSubmit = async (values: ICategoryForm) => {
    const transformedSubCategories = values.subCategories.map((subCategory) => {
      delete subCategory.__typename;
      return subCategory;
    });
    try {
      await createCategory({
        variables: {
          category: {
            restaurant: restaurantId,
            _id: category ? category?._id : '',
            title: values.title,
            subCategories: transformedSubCategories,
          },
        },
      });
    } catch (error) {
      console.error({ error });
      showToast({
        type: 'error',
        title: `${category ? 'Edit' : 'Create'} Category`,
        message: 'Failed to create Category, please try again later.',
      });
    }
  };
  useEffect(() => {
    refetchSubCatrgories();
  }, [isAddCategoryVisible]);
  if (subCategoriesLoading) return <CustomLoader />;
  if (!subCategoriesLoading)
    return (
      <Sidebar
        visible={isAddCategoryVisible}
        position={position}
        onHide={onHide}
        className="w-full sm:w-[450px]"
      >
        <div className="flex h-full w-full items-center justify-start">
          <div className="h-full w-full">
            <div className="flex flex-col gap-2">
              <div className="mb-2 flex flex-col">
                <span className="text-lg">
                  {category ? 'Edit' : 'Add'} Category
                </span>
              </div>
              <div>
                <Formik
                  initialValues={initialValues}
                  validationSchema={CategorySchema}
                  onSubmit={handleSubmit}
                  enableReinitialize
                >
                  {({
                    values,
                    errors,
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                  }) => {
                    return (
                      <Form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                          <div>
                            <CustomTextField
                              type="text"
                              name="title"
                              placeholder="Title"
                              maxLength={15}
                              value={values.title}
                              onChange={handleChange}
                              showLabel={true}
                              style={{
                                borderColor: onErrorMessageMatcher(
                                  'title',
                                  errors?.title,
                                  CategoryErrors
                                )
                                  ? 'red'
                                  : '',
                              }}
                            />
                          </div>
                          {/* Sub Categories  */}
                          <FieldArray name="subCategories">
                            {({ remove, push }) => (
                              <div>
                                {values?.subCategories?.map(
                                  (value: ISubCategory, index) => {
                                    if (values._id) {
                                      setTimeout(
                                        () =>
                                          setFieldValue(
                                            `subCategorites[${index}].parentCategoryId`,
                                            values._id
                                          ),
                                        300
                                      );
                                    }
                                    return (
                                      <div
                                        key={index}
                                        className=" rounded-lg shadow-sm"
                                      >
                                        <Fieldset
                                          legend={`Sub-Category #${index + 1} ${value.title ? `(${value.title})` : ''}`}
                                          toggleable
                                          className="my-1"
                                        >
                                          {/* Sub-Category Field and Remove Button */}
                                          <div className="flex-col justify-center items-center">
                                            <TextIconClickable
                                              icon={
                                                deleteSubCategoryLoading
                                                  ? 'spinner'
                                                  : faTrash
                                              }
                                              iconStyles={{ color: 'red' }}
                                              className={`text-red-500 hover:text-red-700 transition-colors justify-self-end ${deleteSubCategoryLoading ? 'animate-spin' : ''}`}
                                              title=""
                                              onClick={async () => {
                                                if (value._id) {
                                                  remove(index);
                                                  console.log(value._id);
                                                  await deleteSubCategory({
                                                    variables: {
                                                      deleteSubCategoryId2:
                                                        value._id,
                                                    },
                                                  });
                                                }
                                              }}
                                            />
                                            <CustomTextField
                                              name={`subCategories[${index}].title`}
                                              value={value.title}
                                              maxLength={15}
                                              onChange={handleChange}
                                              placeholder="Title"
                                              showLabel={true}
                                              type="text"
                                            />
                                          </div>
                                        </Fieldset>
                                        {/* Add More Button */}
                                        {index ===
                                          (values.subCategories.length - 1 &&
                                            !category) && (
                                          <div className="mt-4">
                                            <TextIconClickable
                                              icon={faAdd}
                                              title="Add More"
                                              onClick={() =>
                                                push({
                                                  title: '',
                                                  parentCategoryId: '',
                                                })
                                              }
                                              className="w-full flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md text-gray-600 hover:text-black hover:border-black transition-all"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </FieldArray>

                          <div className="mt-4 flex justify-end">
                            <CustomButton
                              className="h-10 w-fit border-gray-300 bg-black px-8 text-white"
                              label={category ? 'Update' : 'Add'}
                              type="submit"
                              loading={mutationLoading}
                            />
                          </div>
                        </div>
                      </Form>
                    );
                  }}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    );
}
