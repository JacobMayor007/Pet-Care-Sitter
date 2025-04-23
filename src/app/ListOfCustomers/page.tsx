"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import Loading from "../Loading/page";
import Navigation from "../SitterNavigation/page";
import { useUserAuth } from "../context/AuthContext";

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
}

export default function Customers() {
  const dropDownRef = useRef<HTMLDivElement | null>(null);
  const [requester, setRequester] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [dropdownFilter, setDropdownFilter] = useState(false);

  const { user } = useUserAuth();

  const filterWords = [
    {
      id: 0,
      label: "Pending",
      value: "pending",
    },
    {
      id: 1,
      label: "Approved",
      value: "approved",
    },
    {
      id: 2,
      label: "Paid",
      value: "paid",
    },
  ];

  useEffect(() => {
    const closeNotification = (e: MouseEvent) => {
      if (!dropDownRef.current?.contains(e.target as Node)) {
        setDropdownFilter(false);
      }
    };

    document.body.addEventListener("mousedown", closeNotification);

    return () => {
      document.body.removeEventListener("mouseover", closeNotification);
    };
  }, [dropdownFilter]);

  useEffect(() => {
    const getMyMemorial = async () => {
      try {
        const docRef = collection(db, "requester");
        const q = query(
          docRef,
          where("sitting_service_provider_id", "==", user?.uid || ""),
          where("sitting_service_status", "==", filter)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const result: Requester[] = querySnapshot.docs.map((doc) => {
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
          });

          setRequester(result);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getMyMemorial();
  }, [user, filter]);

  if (loading) {
    return <Loading />;
  }

  console.log(requester);

  return (
    <div className="h-screen max-h-full">
      <nav>
        <Navigation />
      </nav>
      <div className="my-16 flex flex-row justify-between mx-56">
        <h1 className="text-[#393939] text-2xl font-montserrat font-bold">
          List Of My Customers
        </h1>
        <button
          onClick={() => setDropdownFilter((prev) => !prev)}
          className="bg-[#006B95] text-white font-montserrat font-bold w-28 h-10 rounded-md capitalize"
        >
          {filter}
        </button>
        {dropdownFilter && (
          <div
            ref={dropDownRef}
            className="absolute z-20 drop-shadow-md p-2 rounded-md flex flex-col gap-2 justify-center right-52 top-48 bg-white w-32"
          >
            {filterWords.map((data, index) => {
              return (
                <h1
                  key={index}
                  onClick={() => {
                    setFilter(data?.value);
                    setDropdownFilter(false);
                  }}
                  className=" text-center py-2 border-b-[1px] border-slate-300 cursor-pointer"
                >
                  {data.label}
                </h1>
              );
            })}
          </div>
        )}
      </div>
      <div className="mx-56 flex flex-col gap-5">
        {requester.map((data, index) => {
          return (
            <div
              key={index}
              className="rounded-xl drop-shadow-md bg-white h-56 grid grid-cols-4 gap-4"
            >
              <div className="h-32 w-32 rounded-full border-[1px] capitalize font-montserrat font-bold text-2xl m-auto flex justify-center items-center border-slate-300">
                {data?.sitting_service_requester_name?.charAt(0)}
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-montserrat font-bold capitalize text-lg text-[#393939]">
                  Customer Name: {data?.sitting_service_requester_name}
                </h1>
                <h1 className="font-montserrat capitalize text-lg text-[#393939]">
                  On: {data?.sitting_service_startDate?.format("MMMM DD, YYYY")}
                </h1>
                <h1 className="italic text-[#006B95] font-montserrat font-bold underline ">
                  Status: {data?.sitting_service_status}
                </h1>
              </div>
              <div className="m-auto text-center font-montserrat text-[#393939] font-medium">
                Address:{" "}
                <span className="block  font-bold text-[#006B95]">
                  {data?.sitting_service_address}
                </span>
              </div>
              <div className="m-auto text-[#393939] font-hind font-bold text-xl">
                Php {data?.sitting_service_price}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
