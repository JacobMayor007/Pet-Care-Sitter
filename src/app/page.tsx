"use client";

import dayjs, { Dayjs } from "dayjs";
import { useUserAuth } from "./context/AuthContext";
import Navigation from "./SitterNavigation/page";
import { useEffect, useState } from "react";
import {
  collection,
  DocumentData,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase/config";
import Loading from "./Loading/page";
import fetchUserData from "./fetchData/fetchUserData";

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

export default function Home() {
  const { user } = useUserAuth();
  const [requester, setRequester] = useState<Requester[]>([]);
  const [requesterToday, setRequesterToday] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState(0);
  const [oldCustomer, setOldCustomer] = useState(0);
  const [userData, setUserData] = useState<DocumentData[]>([]);
  const [selectedRequster, setSelectedRequester] = useState<Requester | null>(
    null
  );

  useEffect(() => {
    const getUserData = async () => {
      const result = await fetchUserData();
      setUserData(result);
    };
    getUserData();
  }, []);

  useEffect(() => {
    const getMyOffer = async () => {
      try {
        const docRef = collection(db, "requester");
        const q = query(
          docRef,
          where("sitting_service_provider_id", "==", user?.uid || "")
        );
        const docSnap = await getDocs(q);

        const rawResult = docSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const result = rawResult.map((sitter: Requester) => ({
          ...sitter,
          sitting_service_createdAt: sitter?.sitting_service_createdAt
            ? dayjs(sitter?.sitting_service_createdAt.toDate())
            : null,
          sitting_service_endDate: sitter?.sitting_service_endDate
            ? dayjs(sitter?.sitting_service_endDate.toDate())
            : null,
          sitting_service_startDate: sitter?.sitting_service_startDate
            ? dayjs(sitter?.sitting_service_startDate.toDate())
            : null,
        }));

        setRequester(result);

        const today = result.filter((sitter) =>
          sitter.sitting_service_startDate?.isSame(dayjs(), "day")
        );

        setRequesterToday(today);

        console.log("Today Sitter: ", today);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getMyOffer();
  }, [user]);

  useEffect(() => {
    const myNewPatient = async () => {
      try {
        const customerRef = collection(db, "requester");
        const q = query(
          customerRef,
          where("sitting_service_provider_id", "==", user?.uid)
        );
        const querySnapshot = await getDocs(q);

        let newCustomerCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.sitting_service_provider_id &&
            data.sitting_service_isNewCustomer === true
          ) {
            newCustomerCount++;
          }
        });

        setNewCustomer(newCustomerCount);
      } catch (err) {
        console.log(err);
        return 0;
      }
    };

    myNewPatient();
  }, [user]);

  useEffect(() => {
    const myOldCustomer = async () => {
      try {
        const customerRef = collection(db, "requester");
        const q = query(
          customerRef,
          where("sitting_service_provider_id", "==", user?.uid)
        );
        const querySnapshot = await getDocs(q);

        let oldCustomer = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.sitting_service_provider_id &&
            data.sitting_service_isNewCustomer === false
          ) {
            oldCustomer++;
          }
        });

        setOldCustomer(oldCustomer);
      } catch (err) {
        console.log(err);
        return 0;
      }
    };

    myOldCustomer();
  }, [user]);

  if (loading) {
    <Loading />;
  }

  if (!user) {
    return (
      <div>
        <div></div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <nav className="relative z-20">
        <Navigation />
      </nav>
      <div className="ml-56 mr-48 grid grid-cols-7 gap-5 z-10">
        <h1 className="text-4xl font-bold font-montserrat text-[#393939] capitalize text-start col-span-7 mt-8">
          Hello, {userData[0]?.User_Name.split(" ")[0]}
        </h1>
        <div className="h-full pt-5 col-span-3">
          <h1 className="font-montserrat font-semibold text-2xl text-[#393939] mt-2 mb-4">
            Pet Owner Requester Lists
          </h1>
          <div className="border-[1px] border-slate-300 rounded-md bg-white p-4 mb-6 flex flex-col gap-4 drop-shadow-md min-h-52 max-h-[362px] overflow-y-scroll">
            <h1 className="font-montserrat font-bold text-lg text-[#393939] ">
              Today
            </h1>
            <div className="bg-slate-400 w-full h-0.5 rounded-full" />
            {requesterToday?.map((data, index) => {
              return (
                <div
                  key={index}
                  className="grid grid-cols-5 items-center bg-white drop-shadow-md py-2 px-4 rounded-md cursor-pointer"
                  onClick={() => setSelectedRequester(data)}
                >
                  <div className="h-9 w-9 rounded-full border-[1px] border-slate-300 capitalize text-xl flex justify-center items-center font-montserrat font-bold">
                    {data?.sitting_service_requester_name?.charAt(0)}
                  </div>
                  <div className="col-span-2">
                    <h1 className="font-montserrat font-medium capitalize text-lg">
                      {data?.sitting_service_provider_name}
                    </h1>

                    <p className="font-hind italic text-[#006B95] font-bold">
                      {data?.sitting_service_status}
                    </p>
                  </div>
                  <div className="font-montserrat col-span-2 text-center text-lg font-bold capitalize">
                    Php {data?.sitting_service_price}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col pb-10 gap-14">
            <div className="h-80 bg-gradient-to-t from-[#006B95] to-[#61C4EB] rounded-3xl p-10 w-full">
              <h1 className="font-montserrat font-bold text-2xl text-white">
                {" "}
                Total Customers
                <p className="font-hind font-medium text-3xl text-[#00126A] mt-2">
                  {requester.length}
                </p>
              </h1>
              <p className="font-hind font-medium text-3xl text-[#00126A] mt-2"></p>
              <div className="grid grid-cols-2  ">
                <div className="h-[135px] w-[151px] bg-[#D3EDF7] p-4 rounded-2xl flex flex-col gap-4">
                  <h1 className="font-montserrat font-semibold text-base">
                    New Customer
                  </h1>
                  <p className="font-hind font-medium text-[#00126A] text-4xl">
                    {newCustomer}
                  </p>
                </div>
                <div className="h-[135px] w-[151px] bg-[#D3EDF7] p-4 rounded-2xl flex flex-col gap-4">
                  <h1 className="font-montserrat font-semibold text-base">
                    Old Customer
                  </h1>
                  <p className="font-hind font-medium text-[#00126A] text-4xl">
                    {" "}
                    {oldCustomer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-10 w-full rounded-md bg-white drop-shadow-md flex flex-col items-center justify-center col-span-4 mx-auto">
          {!selectedRequster && (
            <h1 className="text-2xl">
              Please Select A Customer To Show It&lsquo;s Address
            </h1>
          )}
          {selectedRequster && (
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(
                selectedRequster?.sitting_service_address || ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-montserrat font-bold text-lg text-white bg-blue-800 rounded-full py-4 px-12 active:scale-95 ease-in-out transition-all duration-75 transform"
            >
              {" "}
              {selectedRequster?.sitting_service_address}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
