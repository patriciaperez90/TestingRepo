'use client';

// Core
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';

// Interface and Types
import {
  ICreateRestaurant,
  ICreateRestaurantResponse,
  IDropdownSelectItem,
  IQueryResult,
  IRestaurantsResponseGraphQL,
} from '@/lib/utils/interfaces';

// Component
import CustomButton from '@/lib/ui/useable-components/button';
import CustomDropdownComponent from '@/lib/ui/useable-components/custom-dropdown';
import CustomMultiSelectComponent from '@/lib/ui/useable-components/custom-multi-select';
import CustomTextField from '@/lib/ui/useable-components/input-field';
import CustomIconTextField from '@/lib/ui/useable-components/input-icon-field';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';

// Constants
import {
  MAX_LANSDCAPE_FILE_SIZE,
  MAX_SQUARE_FILE_SIZE,
  RestaurantErrors,
  SHOP_TYPE,
} from '@/lib/utils/constants';

// Interface
import { IRestaurantForm } from '@/lib/utils/interfaces';

// Methods
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';

// Schemas
import {
  CREATE_RESTAURANT,
  GET_CUISINES,
  GET_RESTAURANTS,
} from '@/lib/api/graphql';
import { RestaurantsContext } from '@/lib/context/super-admin/restaurants.context';
import { ToastContext } from '@/lib/context/global/toast.context';
import { useQueryGQL } from '@/lib/hooks/useQueryQL';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';
import CustomUploadImageComponent from '@/lib/ui/useable-components/upload/upload-image';
import {
  ICuisine,
  IGetCuisinesData,
} from '@/lib/utils/interfaces/cuisine.interface';
import { IRestaurantsAddRestaurantComponentProps } from '@/lib/utils/interfaces/restaurants.interface';
import { toTextCase } from '@/lib/utils/methods';
import { RestaurantSchema } from '@/lib/utils/schema/restaurant';
import { ApolloCache, ApolloError, useMutation } from '@apollo/client';

const initialValues: IRestaurantForm = {
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
  address: '',
  deliveryTime: 0,
  minOrder: 0,
  salesTax: 0.0,
  shopType: null,
  cuisines: [],
  image:
    'https://t4.ftcdn.net/jpg/04/76/57/27/240_F_476572792_zMwqHpmGal1fzh0tDJ3onkLo88IjgNbL.jpg',
  logo: 'https://res.cloudinary.com/dc6xw0lzg/image/upload/v1735894342/dvi5fjbsgdlrzwip0whg.jpg',
};

export default function RestaurantDetailsForm({
  stepperProps,
}: IRestaurantsAddRestaurantComponentProps) {
  // Props
  const { onStepChange, order } = stepperProps ?? {
    onStepChange: () => {},
    type: '',
    order: -1,
  };
  // Context
  const { showToast } = useContext(ToastContext);
  const { restaurantsContextData, onSetRestaurantsContextData } =
    useContext(RestaurantsContext);

  // API
  // Mutation
  const [createRestaurant] = useMutation(CREATE_RESTAURANT, {
    onError,
    onCompleted: ({
      createRestaurant,
    }: {
      createRestaurant?: ICreateRestaurant;
    }) => {
      showToast({
        type: 'success',
        title: 'New Store',
        message: `Store has been added successfully`,
        duration: 3000,
      });

      onSetRestaurantsContextData({
        ...restaurantsContextData,
        restaurant: {
          ...restaurantsContextData?.restaurant,
          _id: {
            label: createRestaurant?.username ?? '',
            code: createRestaurant?._id ?? '',
          },
        },
      });

      onStepChange(order + 1);
    },
    update: update,
  });

  const cuisineResponse = useQueryGQL(GET_CUISINES, {
    debounceMs: 300,
  }) as IQueryResult<IGetCuisinesData | undefined, undefined>;
  cuisineResponse.data?.cuisines;

  // Memoized Constants
  const cuisinesDropdown = useMemo(
    () =>
      cuisineResponse.data?.cuisines?.map((cuisin: ICuisine) => {
        return { label: toTextCase(cuisin.name, 'title'), code: cuisin.name };
      }),
    [cuisineResponse.data?.cuisines]
  );

  // Handlers
  const onCreateRestaurant = async (data: IRestaurantForm) => {
    try {
      const vendorId = restaurantsContextData?.vendor?._id?.code;
      if (!vendorId) {
        showToast({
          type: 'error',
          title: 'Create Store',
          message: `Store Creation Failed - Please select a vendor.`,
          duration: 2500,
        });
        return;
      }

      await createRestaurant({
        variables: {
          owner: vendorId,
          restaurant: {
            name: data.name,
            address: data.address,
            image: data.image,
            logo: data.logo,
            deliveryTime: data.deliveryTime,
            minimumOrder: data.minOrder,
            username: data.username,
            password: data.password,
            shopType: data.shopType?.code,
            salesTax: data.salesTax,
            cuisines: data.cuisines.map(
              (cuisin: IDropdownSelectItem) => cuisin.code
            ),
          },
        },
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'New Store',
        message: `Store Creation Failed`,
        duration: 2500,
      });
    }
  };

  function onError({ graphQLErrors, networkError }: ApolloError) {
    showToast({
      type: 'error',
      title: 'New Store',
      message:
        graphQLErrors[0]?.message ??
        networkError?.message ??
        'Store Creation  Failed',
      duration: 2500,
    });
  }
  function update(
    cache: ApolloCache<unknown>,
    data: ICreateRestaurantResponse
  ): void {
    if (!data) return;

    const restaurantId = restaurantsContextData?.restaurant?._id?.code;

    const cachedData: IRestaurantsResponseGraphQL | null = cache.readQuery({
      query: GET_RESTAURANTS,
    });

    const cachedRestaurants = cachedData?.restaurants ?? [];

    cache.writeQuery({
      query: GET_RESTAURANTS,
      variables: { id: restaurantId },
      data: {
        restaurants: [...(cachedRestaurants ?? []), createRestaurant],
      },
    });
  }

  return (
    <div className="flex h-full w-full items-center justify-start">
      <div className="h-full w-full">
        <div className="flex flex-col gap-2">
          {/* <div className="flex flex-col mb-2">
            <span className="text-lg">Add Restaurant</span>
          </div>
 */}
          <div>
            <Formik
              initialValues={initialValues}
              validationSchema={RestaurantSchema}
              onSubmit={async (values) => {
                await onCreateRestaurant(values);
              }}
              validateOnChange={false}
            >
              {({
                values,
                errors,
                handleChange,
                handleSubmit,
                isSubmitting,
                setFieldValue,
              }) => {
                return (
                  <Form onSubmit={handleSubmit}>
                    <div className="mb-2 space-y-3">
                      <div>
                        <CustomTextField
                          type="text"
                          name="name"
                          placeholder="Name"
                          maxLength={35}
                          value={values.name}
                          onChange={handleChange}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'name',
                              errors?.name,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomIconTextField
                          type="email"
                          name="username"
                          placeholder="Email"
                          maxLength={35}
                          showLabel={true}
                          iconProperties={{
                            icon: faEnvelope,
                            position: 'right',
                            style: { marginTop: '1px' },
                          }}
                          value={values.username}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'username',
                              errors?.username,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomPasswordTextField
                          placeholder="Password"
                          name="password"
                          maxLength={20}
                          value={values.password}
                          showLabel={true}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'password',
                              errors?.password,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomPasswordTextField
                          placeholder="Confirm Password"
                          name="confirmPassword"
                          maxLength={20}
                          showLabel={true}
                          value={values.confirmPassword ?? ''}
                          onChange={handleChange}
                          feedback={false}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'confirmPassword',
                              errors?.confirmPassword,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomTextField
                          placeholder="Address"
                          name="address"
                          type="text"
                          maxLength={100}
                          showLabel={true}
                          value={values.address ?? ''}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'address',
                              errors?.address,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomNumberField
                          suffix="m"
                          min={0}
                          max={500}
                          placeholder="Delivery Time"
                          name="deliveryTime"
                          showLabel={true}
                          value={values.deliveryTime}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'deliveryTime',
                              errors?.deliveryTime,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomNumberField
                          min={1}
                          max={99999}
                          placeholder="Min Order"
                          name="minOrder"
                          showLabel={true}
                          value={values.minOrder}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'minOrder',
                              errors?.minOrder,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>
                      <div>
                        <CustomNumberField
                          prefix="%"
                          min={0}
                          max={100}
                          placeholder="Service Charges"
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          name="salesTax"
                          showLabel={true}
                          value={values.salesTax}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'salesTax',
                              errors?.salesTax,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>
                      <div>
                        <CustomDropdownComponent
                          name="shopType"
                          placeholder="Shop Category"
                          selectedItem={values.shopType}
                          setSelectedItem={setFieldValue}
                          options={SHOP_TYPE}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'shopType',
                              errors?.shopType,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomMultiSelectComponent
                          name="cuisines"
                          placeholder="Cuisines"
                          options={cuisinesDropdown ?? []}
                          selectedItems={values.cuisines}
                          setSelectedItems={setFieldValue}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'cuisines',
                              errors?.cuisines as string,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4">
                        <CustomUploadImageComponent
                          key="logo"
                          name="logo"
                          title="Upload Profile Image"
                          onSetImageUrl={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'logo',
                              errors?.logo as string,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                          fileTypes={['image/webp', 'image/jpg', 'image/jpeg']}
                          maxFileHeight={1080}
                          maxFileWidth={1080}
                          maxFileSize={MAX_SQUARE_FILE_SIZE}
                          orientation="SQUARE"
                          existingImageUrl={values.logo}
                          showExistingImage={true}
                        />
                        <CustomUploadImageComponent
                          key={'image'}
                          name="image"
                          title="Upload Image"
                          onSetImageUrl={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'image',
                              errors?.image as string,
                              RestaurantErrors
                            )
                              ? 'red'
                              : '',
                          }}
                          existingImageUrl={values.image}
                          showExistingImage={true}
                          fileTypes={['image/webp', 'image/jpg', 'image/jpeg']}
                          maxFileHeight={841}
                          maxFileWidth={1080}
                          maxFileSize={MAX_LANSDCAPE_FILE_SIZE}
                          orientation="LANDSCAPE"
                        />
                      </div>

                      <div className="mt-4 flex justify-between">
                        <CustomButton
                          className="h-10 w-fit border-gray-300 bg-black px-8 text-white"
                          label="Back"
                          type="button"
                          onClick={() => onStepChange(order - 1)}
                        />
                        <CustomButton
                          className="h-10 w-fit border-gray-300 bg-black px-8 text-white"
                          label="Save & Next"
                          type="submit"
                          loading={isSubmitting}
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
  );
}
