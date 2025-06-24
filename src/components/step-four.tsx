import React, { useEffect, useState,SetStateAction } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { Calendar, CheckCircle, Loader, MapPin } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import CustomButton from "./CustomButton";
import { ShipmentDetails } from "@/lib/types";
import { format } from "date-fns";
import { useAppContext } from "@/context/AppContext";

interface StepFourProps {
  loading: boolean;
  setStep: Dispatch<SetStateAction<number>>;
  submitShipment: () => void;
  formData: ShipmentDetails;
}

interface ItemOption {
  id: string | number;
  name: string;
}
function StepFour({ loading, submitShipment, formData }: StepFourProps) {
 const { itemCategories, itemTypes, regionStates, regionLga } = useAppContext();
  const { itemsRequest, deliveryPickupRequest } = formData;

  const [categoryName, setCategoryName] = useState("N/A");
  const [typeName, setTypeName] = useState("N/A");
  const [states, setStates] = useState<ItemOption[]>([]);
  const [lgas, setLgas] = useState<ItemOption[]>([]);
useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and handle type properly
        const categories = (await itemCategories()) as unknown as ItemOption[];
        const category = categories.find(
          (cat) => cat.id == itemsRequest.itemCategoryId
        );
        setCategoryName(category?.name || "N/A");

        // Fetch item types
        const types = (await itemTypes(
          itemsRequest.itemCategoryId.toString()
        )) as unknown as ItemOption[];
        const type = types.find((t) => t.id == itemsRequest.itemTypeId);
        setTypeName(type?.name || "N/A");

        // Fetch states and LGAs
        const stateData = (await regionStates()) as unknown as ItemOption[];
        setStates(stateData);
        
        if (itemsRequest.regionState) {
          const lgaData = (await regionLga(
            itemsRequest.regionState.toString()
          )) as unknown as ItemOption[];
          setLgas(lgaData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategoryName("N/A");
        setTypeName("N/A");
      }
    };

    fetchData();
  }, [itemCategories, itemTypes, regionStates, regionLga, itemsRequest]);

  // Now these will work correctly
  const selectedState = states.find(
    (s) => s.id == itemsRequest.regionState
  )?.name || "N/A";
const selectedLga = Array.isArray(lgas) 
  ? (lgas.find(lga => lga.id == itemsRequest.regionLgaId)?.name || "N/A")
  : "N/A";


  const formatDate = (dateString: string | undefined) => {
    return dateString ? format(new Date(dateString), "yyyy-MM-dd") : "N/A";
  };

  return (
    <div className="grid gap-6 mb-10">
      <div className="grid gap-4">
        {/* Item Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Item Category</label>
          <Input value={categoryName} disabled />
        </div>

        {/* Item Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Item Type</label>
          <Input value={typeName} disabled />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium mb-1">Size</label>
          <div className="grid grid-cols-3 gap-4">
            <Input value={`${itemsRequest.length} cm`} disabled />
            <Input value={`${itemsRequest.weight} cm`} disabled />
            <Input value={`${itemsRequest.height} cm`} disabled />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <Input value={String(itemsRequest.quantity)} disabled />
        </div>

        {/* Pickup Address */}
        <div>
          <label className="block text-sm font-medium mb-1">Pickup Address</label>
          <div className="relative">
            <Input value={deliveryPickupRequest.pickUpAddress} disabled />
            <Button variant="ghost" className="absolute right-0 top-0 h-full px-3">
              <MapPin className="h-5 w-5 text-navy-blue" />
            </Button>
          </div>
        </div>

        {/* Pickup State */}
        <div>
          <label className="block text-sm font-medium mb-1">Pickup State</label>
          <Input value={selectedState} disabled />
        </div>

        {/* Pickup LGA */}
        <div>
          <label className="block text-sm font-medium mb-1">Pickup LGA</label>
          <Input value={selectedLga} disabled />
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium mb-1">Delivery Address</label>
          <Input value={deliveryPickupRequest.deliveryAddress} disabled />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pickup date</label>
            <Input value={formatDate(deliveryPickupRequest.pickupDate)} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery date</label>
            <Input value={formatDate(deliveryPickupRequest.deliveryDate)} disabled />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-1">Upload photo of item</label>
          {itemsRequest.imageUrl ? (
            <div className="border rounded-lg p-4 flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <img
                    src={itemsRequest.imageUrl}
                    alt="item"
                    className="w-8 h-8 object-cover rounded"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {itemsRequest.imageUrl.split("/").pop()}
                </p>
              </div>
              <div className="ml-auto">
                <CheckCircle className="h-5 w-5 text-navy-blue" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No image uploaded</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Instruction for transport provider
          </label>
          <Textarea
            value={itemsRequest.instructions}
            className="min-h-[100px]"
            disabled
          />
        </div>
      </div>

      {/* Submit */}
      <CustomButton
        title={loading ? <Loader /> : "Create Bid"}
        disabled={loading}
        onClick={submitShipment}
        className="w-full bg-[#0E1E3F] text-white"
        bgVariant="secondary"
        textVariant="primary"
      />
    </div>
  );
}

export default StepFour;
