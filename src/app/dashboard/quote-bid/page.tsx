"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import { APIURL } from "@/context/Actions";
import Swal from "sweetalert2";

// Toast setup
const toast = Swal.mixin({
  toast: true,
  position: "top-start",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

// Format Naira currency
const formatNaira = (amount: string | number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

// Types
interface Shipment {
  shipmentId: string;
  transporterId: string;
  from: string;
  to: string;
  quote: string;
  pickupDate: string;
  deliveryDate: string;
  status: string;
  trackingDetails: any;
  timeCreated: string;
  asBidded?: string | boolean;
  item: {
    name: string;
    description: string;
  };
  quotes?: Bid[];
}

interface Bid {
  quoteId: string;
  shipmentId: string;
  transporterId: string;
  amount: string;
  dateSubmitted?: string;
}

export default function QuoteDataTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBiddersModal, setShowBiddersModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: string | null;
  }>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [mainUser, setMainUser] = useState<string | null>(null);

  const pageSize = 10;

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem("vubids_token");
      const res = await axios.get(
        `${APIURL}/Shipments/get-all-shipment-landing`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.status && Array.isArray(res.data.data)) {
        setShipments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load shipments");
    }
  };

  useEffect(() => {
    setMainUser(localStorage.getItem("user_Type"));
    fetchShipments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.toLocaleString("default", {
      month: "long",
    })}-${date.getFullYear()}`;
  };
  const handleSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: string) => {
    if (sortConfig.key !== columnName)
      return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedShipments = [...shipments].sort((a, b) => {
    const key = sortConfig.key as keyof Shipment;
    if (!key) return 0;
    const aVal = a[key]?.toString().toLowerCase() || "";
    const bVal = b[key]?.toString().toLowerCase() || "";
    return sortConfig.direction === "ascending"
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const filteredShipments = sortedShipments.filter((s) =>
    activeTab === "All" ? true : s.status === activeTab
  );
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredShipments.length / pageSize);

  const handleBidSubmit = async () => {
    if (!quoteAmount || !selectedShipment) {
      toast.fire({ icon: "error", title: "Please enter a quote amount" });
      return;
    }

    try {
      const token = localStorage.getItem("vubids_token");
      const res = await axios.post(
        `${APIURL}/Quotes/make-bid`,
        {
          shipmentId: selectedShipment.shipmentId,
          amount: quoteAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status) {
        toast.fire({ icon: "success", title: "Bid submitted successfully" });
        setShowBidModal(false);
        setQuoteAmount("");
        fetchShipments();
      } else {
        toast.fire({ icon: "error", title: res.data.message || "Bid failed" });
      }
    } catch (err) {
      toast.fire({ icon: "error", title: "Error submitting bid" });
    }
  };

  const handleAcceptBid = async (quote: Bid) => {
    const quoteAmount = Number(quote.amount);
    const tenPercent = Math.round(quoteAmount * 0.1);
    const total = quoteAmount + tenPercent;

    const formattedTenPercent = formatNaira(tenPercent);
    const formattedTotal = formatNaira(total);

    const confirmed = await Swal.fire({
      title: "Accept this bid?",
      html: `A total of <strong>${formattedTotal}</strong> will be paid, including <strong>${formattedTenPercent}</strong> (10% of the quote amount).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Accept Bid",
    });

    if (confirmed.isConfirmed) {
      try {
        const token = localStorage.getItem("vubids_token");
        const res = await axios.post(
          `${APIURL}/Quotes/accept-bid`,
          { quouteId: quote.quoteId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.status) {
          toast.fire({ icon: "success", title: "Bid accepted!" });
          fetchShipments();
          setShowBiddersModal(false);
        } else {
          toast.fire({
            icon: "error",
            title: res.data.message || "Failed to accept",
          });
        }
      } catch (err) {
        toast.fire({ icon: "error", title: "Error accepting bid" });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto mb-10 lg:p-4 bg-white">
      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ShipmentId",
                "Transporter",
                "From",
                "To",
                "Quote",
                "Pickup Date",
                "Delivery Date",
              ].map((key) => (
                <th
                  key={key}
                  className="px-2 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  <button
                    className="flex items-center"
                    onClick={() => handleSort(key)}
                  >
                    {key} {getSortIcon(key)}
                  </button>
                </th>
              ))}
              <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedShipments.map((shipment) => {
              const isDisabled =
                shipment.status === "Accepted" ||
                (mainUser === "Yes" &&
                  (shipment.asBidded === true || shipment.asBidded === "Yes"));

              const actionLabel =
                mainUser === "Yes"
                  ? shipment.asBidded === true || shipment.asBidded === "Yes"
                    ? "Already Bidded"
                    : "Bid For This"
                  : "View Bidders";

              return (
                <tr key={shipment.shipmentId} className="hover:bg-gray-50">
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {shipment.shipmentId}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {shipment.transporterId}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {shipment.from}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {shipment.to}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {formatNaira(shipment.quote)}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {formatDate(shipment.pickupDate)}
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-500">
                    {formatDate(shipment.deliveryDate)}
                  </td>
                  <td className="px-2 py-4 text-sm">
                    <Badge
                      className={cn("text-xs", {
                        "bg-green-100 text-green-800":
                          shipment.status === "Accepted",
                        "bg-yellow-100 text-yellow-800":
                          shipment.status === "In-Transit",
                        "bg-red-100 text-red-800":
                          shipment.status === "Canceled",
                        "bg-gray-100 text-gray-800": ![
                          "Accepted",
                          "In-Transit",
                          "Canceled",
                        ].includes(shipment.status),
                      })}
                    >
                      {shipment.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-4">
                    <Button
                      variant={mainUser === "Yes" ? "default" : "outline"}
                      size="sm"
                      className={
                        mainUser === "Yes"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "text-blue-700 border-blue-700"
                      }
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedShipment(shipment);
                        if (mainUser === "Yes") {
                          if (shipment.asBidded !== "Yes")
                            setShowBidModal(true);
                        } else {
                          setShowBiddersModal(true);
                        }
                      }}
                    >
                      {actionLabel}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm pt-1">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Make a Bid Modal */}
      <Dialog open={showBidModal} onOpenChange={setShowBidModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Bid</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm">
                  <strong>Item:</strong> {selectedShipment.item.name}
                </p>
                <p className="text-sm">
                  <strong>From:</strong> {selectedShipment.from}
                </p>
                <p className="text-sm">
                  <strong>To:</strong> {selectedShipment.to}
                </p>
              </div>
              <input
                type="number"
                className="w-full p-2 border rounded"
                placeholder="Enter your quote amount"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
              />
              <Button className="w-full" onClick={handleBidSubmit}>
                Submit Bid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Bidders Modal */}
      <Dialog open={showBiddersModal} onOpenChange={setShowBiddersModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bidders for Shipment</DialogTitle>
          </DialogHeader>
          {selectedShipment?.quotes?.length ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedShipment.quotes.map((q) => (
                <div
                  key={q.quoteId}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <div>
                    <p className="text-sm">
                      <strong>Amount:</strong> {formatNaira(q.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted:{" "}
                      {q.dateSubmitted && formatDate(q.dateSubmitted)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptBid(q)}>
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No bids yet for this shipment.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
