"use client";

import dayjs, { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/config";
import Navigation from "@/app/SitterNavigation/page";
import { Modal, Rate } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface Requester {
  id?: string;
  sitting_service_address?: string;
  sitting_service_createdAt?: Dayjs | null;
  sitting_service_endDate?: Dayjs | null;
  sitting_service_isNewCustomer?: boolean;
  sitting_service_payment_type?: string;
  sitting_service_provider_email?: string;
  sitting_service_provider_id?: string;
  sitting_service_provider_name?: string;
  sitting_service_requester_email?: string;
  sitting_service_requester_id?: string;
  sitting_service_requester_name?: string;
  sitting_service_startDate?: Dayjs | null;
  sitting_service_status?: string;
  sitting_service_price?: number;
  sitting_service_feedback_and_rate: {
    rate: number;
    feedback: string;
  };
}

interface MyOfferID {
  params: Promise<{ id: string }>;
}

export default function TransactionsMyOffer({ params }: MyOfferID) {
  const { id } = React.use(params);
  const [requester, setRequester] = useState<Requester | null>(null);
  const [paidModal, setPaidModal] = useState(false);
  const [successful, setSuccessful] = useState(false);

  useEffect(() => {
    const OfferID = async () => {
      try {
        const docRef = doc(db, "requester", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const result = {
            id: docSnap.id,
            ...data,
            sitting_service_createdAt: data?.sitting_service_createdAt
              ? dayjs(data?.sitting_service_createdAt.toDate())
              : null,
            sitting_service_endDate: data?.sitting_service_endDate
              ? dayjs(data?.sitting_service_endDate.toDate())
              : null,
            sitting_service_startDate: data?.sitting_service_startDate
              ? dayjs(data?.sitting_service_startDate.toDate())
              : null,
          } as Requester;

          setRequester(result);
        }
      } catch (error) {
        console.error(error);
      }
    };

    OfferID();
  });

  const paidHandle = async () => {
    try {
      const docRef = doc(db, "requester", id || "");
      const docSnap = await getDoc(docRef);
      const notifRef = collection(db, "notifications");

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          sitting_service_status: "paid",
        });

        await addDoc(notifRef, {
          createdAt: Timestamp.now(),
          sitter_id: id,
          receiverID: requester?.sitting_service_requester_id,
          senderID: requester?.sitting_service_provider_id,
          receiver_fullName: requester?.sitting_service_requester_name,
          sender_fullname: requester?.sitting_service_provider_name,
          message: `${requester?.sitting_service_provider_name} have received your payment. Please rate, and give your feedback.`,
          open: false,
          status: "unread",
          hide: false,
          title: "sitter",
        });
        setSuccessful(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (successful) {
    setInterval(() => {
      setSuccessful(false);
    }, 1500);
    return (
      <div className="h-screen ">
        <div className="flex flex-row items-center justify-center mt-32 gap-4 animate-bounce ease-in-out transform-gpu duration-1000">
          <div className=" h-24 w-24 bg-white rounded-full flex items-center justify-center p-1">
            <div className="h-full w-full rounded-full bg-[#25CA85] flex items-center justify-center flex-row">
              <FontAwesomeIcon icon={faCheck} className="text-white h-14" />{" "}
            </div>
          </div>
          <h1 className="font-montserrat font-bold text-3xl">Succeful!</h1>
        </div>
      </div>
    );
  }
  return (
    <div>
      <nav className="relative z-20">
        <Navigation />
      </nav>
      <div className="mx-56 flex flex-col gap-5 my-16">
        <div className="rounded-xl drop-shadow-md bg-white h-56 grid grid-cols-4 gap-4 relative">
          <div className="h-32 w-32 rounded-full border-[1px] capitalize font-montserrat font-bold text-2xl m-auto flex justify-center items-center border-slate-300">
            {requester?.sitting_service_requester_name?.charAt(0)}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <h1 className="font-montserrat font-bold capitalize text-lg text-[#393939]">
              Customer Name: {requester?.sitting_service_requester_name}
            </h1>
            <h1 className="font-montserrat capitalize text-lg text-[#393939]">
              On:{" "}
              {requester?.sitting_service_startDate?.format("MMMM DD, YYYY")}
            </h1>
            <h1 className="text-[#393939] font-montserrat font-bold">
              Location:{" "}
            </h1>
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(
                requester?.sitting_service_address || ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-montserrat text-center font-bold text-sm px-4 w-fit text-white bg-blue-800 rounded-full py-3 block active:scale-95"
            >
              {requester?.sitting_service_address}
            </a>
          </div>
          <div className="m-auto font-montserrat font-bold text-xl">
            Php {requester?.sitting_service_price}
          </div>

          {requester?.sitting_service_status === "approved" &&
            requester?.sitting_service_endDate?.isSame(dayjs(), "day") && (
              <button
                onClick={() => setPaidModal(true)}
                className="bg-[#006B95] text-white font-montserrat font-bold px-4 m-auto py-2 rounded-full active:scale-95"
              >
                Click here if paid
              </button>
            )}
          {requester?.sitting_service_status === "paid" && (
            <h1 className="font-montserrat font-bold text-xl m-auto text-[#006B95]">
              Paid
            </h1>
          )}
          <Rate
            value={requester?.sitting_service_feedback_and_rate?.rate}
            className="absolute top-6 right-10"
            disabled
          />
        </div>
      </div>
      <Modal
        open={paidModal}
        centered
        onCancel={() => setPaidModal(false)}
        onClose={() => setPaidModal(false)}
        onOk={() => {
          setPaidModal(false);
          paidHandle();
        }}
      >
        <h1 className="font-hind text-[#393939]">
          Confirming that{" "}
          <span className="font-montserrat font-bold text-lg text-[#006B95] capitalize">
            {requester?.sitting_service_requester_name}
          </span>{" "}
          has paid?
        </h1>
      </Modal>
    </div>
  );
}
