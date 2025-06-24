"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { APIURL } from "@/context/Actions";
import { addDays, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
interface StepTwoProps {
  formData: any;
  setFormData: (value: any) => void;
  setStartData: (value: any) => void;
  handleNext: () => void;
}
function StepTwo({
  formData,
  setFormData,
  setStartData,
  handleNext,
}: StepTwoProps) {
  const deliveryData = formData.deliveryPickupRequest || {};

  const [regionStates, setRegionStates] = useState<any[]>([]);
  const [regionLgas, setRegionLgas] = useState<any[]>([]);
  const fetchStates = async () => {
    const res = await fetch(`${APIURL}/GeneralSetup/get-all-region-state`);
    const data = await res.json();
    setRegionStates(data.data);
  };

  const fetchLgas = async (stateId: string) => {
    const res = await fetch(
      `${APIURL}/GeneralSetup/get-all-region-lga/${stateId}`
    );
    const data = await res.json();
    setRegionLgas(data.data);
  };
  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (formData.regionState) fetchLgas(formData.regionState);
  }, [formData.regionState]);
  return (
    <div>
      <div className="grid gap-6">
        {/* Pickup Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Pickup Address
          </label>
          <div className="relative">
            <Input
              placeholder="Enter address manually or choose on map"
              value={deliveryData.pickUpAddress || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  deliveryPickupRequest: {
                    ...prev.deliveryPickupRequest,
                    pickUpAddress: e.target.value,
                  },
                }))
              }
            />
            <Button
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3"
            >
              <MapPin className="h-5 w-5 text-navy-blue" />
            </Button>
          </div>
        </div>
        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Delivery Address
          </label>
          <div className="relative">
            <Input
              placeholder="Enter address manually or choose on map"
              value={deliveryData.deliveryAddress || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  deliveryPickupRequest: {
                    ...prev.deliveryPickupRequest,
                    deliveryAddress: e.target.value,
                  },
                }))
              }
            />
            <Button
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3"
            >
              <MapPin className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
        {/* Pickup and Delivery Dates */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pickup Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {deliveryData.pickupDate
                  ? format(new Date(deliveryData.pickupDate), "MM/dd/yyyy")
                  : "Pick a pickup date"}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  deliveryData.pickupDate
                    ? new Date(deliveryData.pickupDate)
                    : undefined
                }
                onSelect={(date) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    deliveryPickupRequest: {
                      ...prev.deliveryPickupRequest,
                      pickupDate: date?.toISOString() || "",
                      deliveryDate: "", // reset delivery date if pickup changes
                    },
                  }))
                }
                disabled={(date) =>
                  isBefore(startOfDay(date), startOfDay(new Date()))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Delivery Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {deliveryData.deliveryDate
                  ? format(new Date(deliveryData.deliveryDate), "MM/dd/yyyy")
                  : "Pick a delivery date"}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  deliveryData.deliveryDate
                    ? new Date(deliveryData.deliveryDate)
                    : undefined
                }
                onSelect={(date) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    deliveryPickupRequest: {
                      ...prev.deliveryPickupRequest,
                      deliveryDate: date?.toISOString() || "",
                    },
                  }))
                }
                disabled={(date) => {
                  const pickupDate = deliveryData.pickupDate
                    ? new Date(deliveryData.pickupDate)
                    : null;
                  if (!pickupDate) return true; // disable all if no pickup date
                  const maxDate = addDays(startOfDay(pickupDate), 3);
                  return (
                    isBefore(startOfDay(date), startOfDay(pickupDate)) ||
                    isAfter(startOfDay(date), maxDate)
                  );
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Map Image */}
        <div className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/images/map.png"
              alt="Map showing route"
              width={600}
              height={300}
              className="w-full h-[300px] object-cover"
            />
          </div>
        </div>
       
        {/* Next Button */}
        <Button onClick={handleNext} className="w-full bg-[#0E1E3F] text-white">
          Next
        </Button>
      </div>
    </div>
  );
}
export default StepTwo;
