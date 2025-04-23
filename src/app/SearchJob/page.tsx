"use client";

import dayjs, { Dayjs } from "dayjs";
import Navigation from "../SitterNavigation/page";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  DocumentData,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Modal } from "antd";
import "@ant-design/v5-patch-for-react-19";
import fetchUserData from "../fetchData/fetchUserData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
interface RequestJob {
  id?: string;
  sitting_service_address?: string;
  sitting_service_createdAt?: Dayjs | null;
  sitting_service_endDate?: Dayjs | null;
  sitting_service_payment_type?: string;
  sitting_service_requester_email?: string;
  sitting_service_requester_id?: string;
  sitting_service_requester_name?: string;
  sitting_service_startDate?: Dayjs | null;
  sitting_service_status?: string;
  sitting_service_price?: number;
}

interface Requester {
  id?: string;
  sitting_service_status?: string;
}

export default function SearchJob() {
  const [offers, setOffers] = useState<RequestJob[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<RequestJob | null>(null);
  const [offerModal, setOfferModal] = useState(false);
  const [userData, setUserData] = useState<DocumentData[]>([]);
  const [successful, setSuccessful] = useState(false);
  const [pending, setPending] = useState<Requester[]>([]);

  useEffect(() => {
    const getUserData = async () => {
      const result = await fetchUserData();
      setUserData(result);
    };
    getUserData();
  }, []);

  useEffect(() => {
    const getPendingOffer = async () => {
      try {
        const docRef = collection(db, "requester");
        const q = query(
          docRef,
          where("sitting_service_provider_id", "==", userData[0]?.User_UID),
          where("sitting_service_offering_id", "==", selectedOffer?.id)
        );
        const docSnap = await getDocs(q);

        const result = docSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPending(result);
      } catch (error) {
        console.error(error);
      }
    };

    getPendingOffer();
  }, [userData, selectedOffer]);

  useEffect(() => {
    const getOffers = async () => {
      try {
        const docRef = collection(db, "offer");
        const q = query(
          docRef,
          where("sitting_service_status", "==", "pending")
        );
        const docSnap = await getDocs(q);

        const result = docSnap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
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
            };
          })
          .filter(
            (offer) =>
              offer.sitting_service_startDate &&
              offer.sitting_service_startDate.isSameOrAfter(dayjs(), "day")
          );

        setOffers(result);
      } catch (error) {
        console.error(error);
      }
    };

    getOffers();
  }, []);

  const offerHandle = async () => {
    try {
      const docRef = collection(db, "requester");
      const addOffer = await addDoc(docRef, {
        sitting_service_address: selectedOffer?.sitting_service_address,
        sitting_service_createdAt: Timestamp.now(),
        sitting_service_endDate: selectedOffer?.sitting_service_endDate
          ? Timestamp.fromDate(selectedOffer.sitting_service_endDate.toDate())
          : null,
        sitting_service_payment_type:
          selectedOffer?.sitting_service_payment_type,
        sitting_service_price: selectedOffer?.sitting_service_price,
        sitting_service_provider_email: userData[0]?.User_Email,
        sitting_service_provider_id: userData[0]?.User_UID,
        sitting_service_provider_name: userData[0]?.User_Name,
        sitting_service_requester_email:
          selectedOffer?.sitting_service_requester_email,
        sitting_service_requester_id:
          selectedOffer?.sitting_service_requester_id,
        sitting_service_requester_name:
          selectedOffer?.sitting_service_requester_name,
        sitting_service_startDate: selectedOffer?.sitting_service_startDate
          ? Timestamp.fromDate(
              selectedOffer?.sitting_service_startDate.toDate()
            )
          : null,
        sitting_service_status: "offering",
        sitting_service_offering_id: selectedOffer?.id,
      });

      const sitterReqRef = collection(db, "notifications");
      await addDoc(sitterReqRef, {
        createdAt: Timestamp.now(),
        sitter_id: addOffer.id,
        receiverID: selectedOffer?.sitting_service_requester_id,
        senderID: userData[0]?.User_UID,
        receiver_fullName: selectedOffer?.sitting_service_requester_name,
        sender_fullname: userData[0]?.User_Name,
        message: `${
          userData[0]?.User_Name
        } wants to offer their pet sitting services for your request from ${selectedOffer?.sitting_service_startDate?.format(
          "MMMM DD, YYYY - hh:mm A"
        )} to ${selectedOffer?.sitting_service_endDate?.format(
          "MMMM DD, YYYY - hh:mm A"
        )}.`,
        open: false,
        status: "unread",
        hide: false,
        title: "sitting",
      });

      setSuccessful(true);
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

  console.log(pending);

  return (
    <div className="h-screen flex flex-col">
      <nav className="relative z-20">
        <Navigation />
      </nav>
      <h1 className="mx-52 my-6 font-montserrat font-bold text-[#393939] text-2xl italic">
        List of Request to Pet Sit
      </h1>
      <div className="mx-52 grid grid-cols-2 h-full pb-2 gap-4">
        <div className="bg-white drop-shadow-md rounded-lg border-2 mb-4 p-4 h-full grid grid-rows-5 overflow-y-scroll">
          {offers.map((data, index) => {
            return (
              <div
                key={index}
                onClick={() => setSelectedOffer(data)}
                className="grid grid-cols-5 items-center bg-white drop-shadow-md rounded-md cursor-pointer"
              >
                <div className="h-12 w-12 mx-auto rounded-full border-slate-300 border-[1px] capitalize font-montserrat font-bold text-lg flex items-center justify-center">
                  {data?.sitting_service_requester_name?.charAt(0)}
                </div>
                <div className="col-span-2">
                  <h1 className="font-montserrat font-bold capitalize text-lg overflow-hidden text-ellipsis">
                    {data?.sitting_service_requester_name}
                  </h1>
                  <h1 className="font-hind text-[#393939] font-medium overflow-hidden text-ellipsis">
                    {data?.sitting_service_requester_email}
                  </h1>
                  <h1 className="font-hind overflow-hidden text-ellipsis">
                    Starts at:{" "}
                    <span className="text-[#393939] font-bold">
                      {data?.sitting_service_startDate?.format("MMMM DD, YYYY")}
                    </span>
                  </h1>
                  <h1 className="font-hind overflow-hidden text-ellipsis">
                    End At:{" "}
                    <span className="text-[#393939] font-bold">
                      {data?.sitting_service_endDate?.format("MMMM DD, YYYY")}
                    </span>
                  </h1>
                </div>
                <div className="text-[#006B95] font-hind italic font-bold capitalize text-center">
                  {data?.sitting_service_status}
                </div>
                <div className="text-center">
                  <h1 className="text-[#393939] font-montserrat font-bold text-lg">
                    Php <span>{data?.sitting_service_price}</span>
                  </h1>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className={`${
            selectedOffer ? `grid` : `hidden`
          } grid-rows-11 bg-white rounded-lg p-4 drop-shadow-md border-slate-300 border-[1px]`}
        >
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <div className="h-11 w-11 rounded-full border-slate-300 border-[1px] capitalize font-montserrat font-bold text-lg justify-center items-center flex">
                {selectedOffer?.sitting_service_requester_name?.charAt(0)}
              </div>
              <h1 className="font-hind text-[#393939]">
                Name:{" "}
                <span className="font-bold capitalize text-lg">
                  {selectedOffer?.sitting_service_requester_name}
                </span>
              </h1>
            </div>
            {pending.length < 1 && (
              <button
                onClick={() => setOfferModal(true)}
                className="bg-green-500 font-montserrat font-bold text-white px-4 py-2 rounded-full"
              >
                Offer To Pet Sit Now
              </button>
            )}
            {pending.length > 0 && (
              <h1 className="font-hind text-green-500 italic font-medium">
                {pending?.map((data, index) => {
                  return (
                    <span className="capitalize" key={index}>
                      {data?.sitting_service_status === "offering"
                        ? `pending`
                        : ``}
                    </span>
                  );
                })}
              </h1>
            )}
          </div>
          <div className="bg-white row-span-5 rounded-lg drop-shadow-md flex justify-center items-center">
            {selectedOffer && (
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(
                  selectedOffer?.sitting_service_address || ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-montserrat text-center font-bold text-sm px-4 w-fit text-white bg-blue-800 rounded-full py-3 block active:scale-95"
              >
                {selectedOffer?.sitting_service_address}
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 mt-4 row-span-5">
            <p className="font-hind">
              Email:{" "}
              <span className="text-[#393939] font-bold">
                {selectedOffer?.sitting_service_requester_email}
              </span>
            </p>
            <h1 className="font-hind">
              Start Date:{" "}
              <span className="text-[#393939] font-bold">
                {selectedOffer?.sitting_service_startDate?.format(
                  "MMMM DD, YYYY"
                )}
              </span>
            </h1>
            <h1 className="font-hind">
              End Date:{" "}
              <span className="text-[#393939] font-bold">
                {selectedOffer?.sitting_service_endDate?.format(
                  "MMMM DD, YYYY"
                )}
              </span>
            </h1>
            <h1 className="font-hind text-lg">
              Status:{" "}
              <span className="font-montserrat font-bold capitalize">
                {selectedOffer?.sitting_service_status}
              </span>
            </h1>
            <h1 className="font-hind text-[#393939] text-lg">
              Price:{" "}
              <span className="font-montserrat font-bold ">
                Php {selectedOffer?.sitting_service_price}
              </span>
            </h1>
            <h1 className="font-montserrat font-medium">
              Payment Type: {selectedOffer?.sitting_service_payment_type}
            </h1>
          </div>
        </div>
      </div>
      <Modal
        open={offerModal}
        onCancel={() => setOfferModal(false)}
        onClose={() => setOfferModal(false)}
        onOk={() => {
          offerHandle();
          setOfferModal(false);
        }}
        centered
      >
        Do you confirm to pet sit{" "}
        <span className="capitalize font-hind text-[#006B95] font-bold">
          {selectedOffer?.sitting_service_requester_name}
        </span>
      </Modal>
    </div>
  );
}
