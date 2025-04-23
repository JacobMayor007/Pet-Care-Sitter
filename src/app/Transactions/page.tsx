"use client";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/app/firebase/config";
import Loading from "@/app/Loading/page";
import Navigation from "@/app/SitterNavigation/page";
import { useUserAuth } from "@/app/context/AuthContext";
import { Modal } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

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

export default function TransactionsCustomer() {
  const dropDownRef = useRef<HTMLDivElement | null>(null);
  const [successful, setSuccessful] = useState(false);
  const [requester, setRequester] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [dropdownFilter, setDropdownFilter] = useState(false);
  const [dropdownFilterJob, setDropdownFilterJob] = useState(false);
  const [acceptModal, setAcceptModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Requester | null>(null);
  const [paidModal, setPaidModal] = useState(false);

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
        setDropdownFilterJob(false);
      }
    };

    document.body.addEventListener("mousedown", closeNotification);

    return () => {
      document.body.removeEventListener("mouseover", closeNotification);
    };
  }, [dropdownFilter, dropdownFilterJob]);

  useEffect(() => {
    const getMyRequest = async () => {
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

    getMyRequest();
  }, [user, filter]);

  const approvedHandle = async () => {
    try {
      const docRef = doc(db, "requester", selectedUser?.id || "");
      const docSnap = await getDoc(docRef);
      const notifRef = collection(db, "notifications");

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          sitting_service_status: "approved",
        });

        await addDoc(notifRef, {
          createdAt: Timestamp.now(),
          sitter_id: selectedUser?.id,
          receiverID: selectedUser?.sitting_service_requester_id,
          senderID: user?.uid,
          receiver_fullName: selectedUser?.sitting_service_requester_name,
          sender_fullname: selectedUser?.sitting_service_provider_name,
          message: `${
            selectedUser?.sitting_service_provider_name
          } approved to pet sit on ${selectedUser?.sitting_service_createdAt?.format(
            "MMMM DD, YYYY"
          )}`,
          open: false,
          status: "unread",
          hide: false,
          title: "sitter",
        });
        setSuccessful(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const paidHandle = async () => {
    try {
      const docRef = doc(db, "requester", selectedUser?.id || "");
      const docSnap = await getDoc(docRef);
      const notifRef = collection(db, "notifications");

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          sitting_service_status: "paid",
        });

        await addDoc(notifRef, {
          createdAt: Timestamp.now(),
          sitter_id: selectedUser?.id,
          receiverID: selectedUser?.sitting_service_requester_id,
          senderID: user?.uid,
          receiver_fullName: selectedUser?.sitting_service_requester_name,
          sender_fullname: selectedUser?.sitting_service_provider_name,
          message: `${selectedUser?.sitting_service_provider_name} have received your payment. Please rate, and give your feedback.`,
          open: false,
          status: "unread",
          hide: false,
          title: "sitter",
        });
        setSuccessful(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const rejectHandle = async () => {
    try {
      const docRef = doc(db, "requester", selectedUser?.id || "");
      const docSnap = await getDoc(docRef);
      const notifRef = collection(db, "notifications");

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          sitting_service_status: "rejected",
        });

        await addDoc(notifRef, {
          createdAt: Timestamp.now(),
          sitter_id: selectedUser?.id,
          receiverID: selectedUser?.sitting_service_requester_id,
          senderID: user?.uid,
          receiver_fullName: selectedUser?.sitting_service_requester_name,
          sender_fullname: selectedUser?.sitting_service_provider_name,
          message: `${
            selectedUser?.sitting_service_provider_name
          } declined to pet sit on ${selectedUser?.sitting_service_createdAt?.format(
            "MMMM DD, YYYY"
          )}`,
          open: false,
          status: "unread",
          hide: false,
          title: "sitter",
        });
        setSuccessful(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

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
    <div className="h-screen max-h-full">
      <nav className="relative z-20">
        <Navigation />
      </nav>
      <div
        ref={dropDownRef}
        className="my-16 flex flex-row justify-between mx-56"
      >
        <h1 className="text-[#393939] text-2xl font-montserrat font-bold">
          List Of Transactions
        </h1>
        <div className="flex flex-row gap-5">
          <button
            onClick={() => setDropdownFilter((prev) => !prev)}
            className="bg-[#006B95] text-white font-montserrat font-bold w-36 h-10 rounded-md capitalize"
          >
            {filter}
            <FontAwesomeIcon
              icon={dropdownFilter ? faChevronUp : faChevronDown}
              className="ml-4"
            />
          </button>
          {dropdownFilter && (
            <div className="absolute z-20 drop-shadow-md p-2 rounded-md flex flex-col gap-2 justify-center right-52 top-48 bg-white w-32">
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
      </div>
      {filter === "pending" && (
        <div className="mx-56 flex flex-col gap-5">
          {requester.map((data, index) => {
            return (
              <div
                key={index}
                className="rounded-xl drop-shadow-md bg-white h-56 grid grid-cols-4 gap-4 border-[1px] border-slate-300"
              >
                <div className="h-32 w-32 rounded-full border-[1px] capitalize font-montserrat font-bold text-2xl m-auto flex justify-center items-center border-slate-300">
                  {data?.sitting_service_requester_name?.charAt(0)}
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="font-montserrat font-bold capitalize text-lg text-[#393939]">
                    Customer Name: {data?.sitting_service_requester_name}
                  </h1>
                  <h1 className="font-montserrat capitalize text-lg text-[#393939]">
                    On:{" "}
                    {data?.sitting_service_startDate?.format("MMMM DD, YYYY")}
                  </h1>
                  <h1 className="italic text-[#006B95] font-montserrat font-bold underline ">
                    Status: {data?.sitting_service_status}
                  </h1>
                </div>
                <div className="m-auto text-center font-montserrat text-[#393939] font-medium">
                  Address:{" "}
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      data?.sitting_service_address || ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-montserrat font-bold text-sm px-4 text-white bg-blue-800 rounded-full py-2 block active:scale-95"
                  >
                    {" "}
                    {data?.sitting_service_address}
                  </a>
                </div>
                <div className="m-auto text-[#393939] font-hind font-bold text-xl">
                  Php {data?.sitting_service_price}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAcceptModal(true);
                    setSelectedUser(data);
                  }}
                  className="absolute right-40 -top-5 bg-[#006B95] font-montserrat font-bold py-2 px-6 rounded-full text-white"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal(true);
                    setSelectedUser(data);
                  }}
                  className="absolute right-10 -top-5 bg-red-600 font-montserrat font-bold py-2 px-6 rounded-full text-white"
                >
                  Reject
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filter === "approved" && (
        <div className="mx-56 flex flex-col gap-5">
          {requester.map((data, index) => {
            return (
              <div
                key={index}
                className="rounded-xl drop-shadow-md bg-white h-56 grid grid-cols-4 gap-4 border-[1px] border-slate-300"
              >
                <div className="h-32 w-32 rounded-full border-[1px] capitalize font-montserrat font-bold text-2xl m-auto flex justify-center items-center border-slate-300">
                  {data?.sitting_service_requester_name?.charAt(0)}
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="font-montserrat font-bold capitalize text-lg text-[#393939]">
                    Customer Name: {data?.sitting_service_requester_name}
                  </h1>
                  <h1 className="font-montserrat capitalize text-lg text-[#393939]">
                    On:{" "}
                    {data?.sitting_service_startDate?.format("MMMM DD, YYYY")}
                  </h1>
                  <h1 className="italic text-[#006B95] font-montserrat font-bold underline ">
                    Status: {data?.sitting_service_status}
                  </h1>
                </div>
                <div className="m-auto text-center font-montserrat text-[#393939] font-medium">
                  Address:{" "}
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      data?.sitting_service_address || ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-montserrat font-bold text-sm px-4 text-white bg-blue-800 rounded-full py-2 block active:scale-95"
                  >
                    {" "}
                    {data?.sitting_service_address}
                  </a>
                </div>
                <div className="m-auto text-[#393939] font-hind font-bold text-xl">
                  Php {data?.sitting_service_price}
                </div>
                {data?.sitting_service_status === "approved" &&
                  data?.sitting_service_endDate?.isSame(dayjs(), "day") && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaidModal(true);
                        setSelectedUser(data);
                      }}
                      className="absolute right-8 -top-5 bg-[#006B95] font-montserrat font-bold py-2 px-6 rounded-full text-white"
                    >
                      Click here if paid
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {filter === "paid" && (
        <div className="mx-56 flex flex-col gap-5">
          {requester.map((data, index) => {
            return (
              <div
                key={index}
                className="rounded-xl drop-shadow-md bg-white h-56 grid grid-cols-4 gap-4 border-[1px] border-slate-300"
              >
                <div className="h-32 w-32 rounded-full border-[1px] capitalize font-montserrat font-bold text-2xl m-auto flex justify-center items-center border-slate-300">
                  {data?.sitting_service_requester_name?.charAt(0)}
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="font-montserrat font-bold capitalize text-lg text-[#393939]">
                    Customer Name: {data?.sitting_service_requester_name}
                  </h1>
                  <h1 className="font-montserrat capitalize text-lg text-[#393939]">
                    On:{" "}
                    {data?.sitting_service_startDate?.format("MMMM DD, YYYY")}
                  </h1>
                  <h1 className="italic text-[#006B95] font-montserrat font-bold underline ">
                    Status: {data?.sitting_service_status}
                  </h1>
                </div>
                <div className="m-auto text-center font-montserrat text-[#393939] font-medium">
                  Address:{" "}
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      data?.sitting_service_address || ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-montserrat font-bold text-sm px-4 text-white bg-blue-800 rounded-full py-2 block active:scale-95"
                  >
                    {" "}
                    {data?.sitting_service_address}
                  </a>
                </div>
                <div className="m-auto text-[#393939] font-hind font-bold text-xl">
                  Php {data?.sitting_service_price}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={acceptModal}
        onCancel={() => {
          setAcceptModal(false);
        }}
        onClose={() => setAcceptModal(false)}
        onOk={() => {
          setAcceptModal(false);
          approvedHandle();
        }}
        centered
      >
        <h1 className="font-montserrat font-bold">
          Confirming to accept the offer of{" "}
          <span className="text-[#006B95] capitalize">
            {selectedUser?.sitting_service_requester_name}
          </span>
        </h1>
      </Modal>
      <Modal
        open={rejectModal}
        onCancel={() => {
          setRejectModal(false);
        }}
        onClose={() => setRejectModal(false)}
        onOk={() => {
          setRejectModal(false);
          rejectHandle();
        }}
      >
        <h1 className="font-montserrat font-bold">
          Confirming to reject the offer of{" "}
          <span className="text-[#006B95] capitalize">
            {selectedUser?.sitting_service_requester_name}
          </span>
        </h1>
      </Modal>
      <Modal
        open={paidModal}
        onCancel={() => {
          setPaidModal(false);
        }}
        onClose={() => setPaidModal(false)}
        onOk={() => {
          setPaidModal(false);
          paidHandle();
        }}
        centered
      >
        <h1 className="font-montserrat font-bold">
          Confirming{" "}
          <span className="text-[#006B95] capitalize">
            {selectedUser?.sitting_service_requester_name}
          </span>{" "}
          have paid you?
        </h1>
      </Modal>
    </div>
  );
}
