"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import * as Notifications from "../fetchData/fetchNotifications";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
  collection,
  DocumentData,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import fetchUserData from "../fetchData/fetchUserData";
import Signout from "../Signout/page";
import { useUserAuth } from "../context/AuthContext";

interface Notifications {
  id?: string;
  createdAt?: string;
  hide?: string;
  sitter_id?: string;
  requster_id?: string;
  message?: string;
  receiverID?: string;
  receiver_fullName?: string;
  senderID?: string;
  sender_fullname?: string;
  status?: string;
  title?: boolean;
}

export default function Navigation() {
  const { user } = useUserAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);
  const [logout, setLogout] = useState(false);
  const [userData, setUserData] = useState<DocumentData[]>([]);
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [unopenNotif, setUnopenNotif] = useState(0);

  useEffect(() => {
    const getUserData = async () => {
      const result = await fetchUserData();
      setUserData(result);
    };
    getUserData();
  }, []);

  useEffect(() => {
    const closeNotification = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) {
        setShowNotif(false);
        setLogout(false);
      }
    };

    document.body.addEventListener("mousedown", closeNotification);

    return () => {
      document.body.removeEventListener("mouseover", closeNotification);
    };
  }, [showNotif]);

  useEffect(() => {
    let unsubscribe: () => void;

    const getUnopenNotifications = async () => {
      try {
        const data = await fetchUserData();
        const userUID = data[0]?.User_UID;

        if (!userUID) {
          console.log("Logged In First");
          return;
        }

        unsubscribe = Notifications.UnopenNotification(userUID, (newNotif) => {
          setUnopenNotif(newNotif.length);
        });
      } catch (error) {
        console.log(error);
      }
    };

    getUnopenNotifications();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const latestChats = async () => {
    try {
      if (!user?.email) {
        console.error("User UID is not defined.");
        return;
      }

      console.log(user?.email);

      const docRef = collection(db, "chats");
      const q = query(
        docRef,
        where("participants", "array-contains", user?.email)
      );
      const docSnap = await getDocs(q);

      if (docSnap.empty) {
        console.log("No chats found.");
        router.push("/Message");
      } else {
        const otherUser = docSnap.docs.map((doc) => {
          const chatData = doc.data();
          const otherUserEmail = chatData.participants.find(
            (email: string) => email !== user?.email
          );
          return otherUserEmail;
        });

        const otherUserEmail = otherUser[0];

        const userRef = collection(db, "Users");
        const userQ = query(userRef, where("User_Email", "==", otherUserEmail));
        const userSnap = await getDocs(userQ);

        let otherID: string = "";
        if (!userSnap.empty) {
          otherID = userSnap.docs[0].id;
        }

        router.push(`/Message/${otherID}`);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  return (
    <nav className="h-20 flex flex-row justify-center items-center">
      <div className="flex items-center justify-center gap-16 px-14 w-full">
        <div className="flex items-center">
          <Image src="/Logo.svg" height={54} width={54} alt="Logo" />
          <h1 className="text-2xl font-sigmar font-normal text-[#006B95]">
            Pet Care
          </h1>
        </div>
        <ul className="list-type-none flex items-center gap-12">
          <li className="w-28 h-14 flex items-center justify-center">
            <Link
              href="/"
              className="font-montserrat text-base text-[#006B95] font-bold"
            >
              Dashboard
            </Link>
          </li>
          <li className="w-fit h-14 flex items-center justify-center">
            <Link
              href="/ListOfCustomers"
              className="font-montserrat text-base text-[#006B95] font-bold"
            >
              List Of Customers
            </Link>
          </li>
          <li className="w-28 h-14 flex items-center justify-center ">
            <Link
              href="/Transactions"
              className="font-montserrat text-base text-[#006B95] font-bold"
            >
              Transactions
            </Link>
          </li>
          <Link
            href={`/SearchJob`}
            className="w-28 h-14 flex items-center justify-center font-montserrat text-base text-[#006B95] font-bold"
          >
            Search Job
          </Link>

          <li className="w-28 h-14 flex items-center justify-center">
            <div
              className="font-montserrat text-base text-[#006B95] font-bold cursor-pointer"
              onClick={() => {
                latestChats();
              }}
            >
              Inbox
            </div>
          </li>
        </ul>
        <div className="flex items-center gap-4" ref={btnRef}>
          <div className="relative  flex gap-2">
            <BellOutlined
              className="text-[#006B95] font-bold"
              onClick={() => {
                setShowNotif((prev) => !prev);
                setLogout(logout === true ? false : logout);
                Notifications.openNotification(user?.uid || "");
              }}
            />
            <UserOutlined
              className="text-[#006B95] font-bold text-lg cursor-pointer"
              onClick={() => {
                setLogout((prev) => !prev);
                setShowNotif(false);
              }}
            />
            <div
              className={
                logout
                  ? `grid grid-rows-8 justify-center items-center bg-[#F3F3F3] drop-shadow-xl rounded-lg absolute top-10 -left-3 cursor-pointer h-fit w-56`
                  : `hidden`
              }
            >
              <h1 className="text-center capitalize border-b-[1px] pb-2 border-slate-300">
                {userData[0]?.User_Name}
              </h1>

              <Link
                href={`https://doctor-pet-care-pro.vercel.app/`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Want to become part of our doctors?
              </Link>
              <Link
                href={`https://seller-pet-care-pro.vercel.app/`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Want to become part of our product sellers?
              </Link>
              <Link
                href={`https://boarding-pet-care-pro.vercel.app`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Want to become part of our renters?
              </Link>
              <Link
                href={`https://memorial-pet-care-pro.vercel.app`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Want to become part of our memorials?
              </Link>
              <Link
                href={`https://sitter-pet-care-pro.vercel.app`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Want to become part of our pet sitter?
              </Link>
              <Link
                href={`/Settings`}
                className="text-center font-hind  h-full w-44 flex items-center justify-center border-b-[1px] border-[#B1B1B1]"
              >
                Settings
              </Link>

              <Signout />
            </div>

            <div
              className={
                unopenNotif > 0
                  ? `h-4 w-4 bg-red-500 text-white absolute left-2 -top-3 rounded-full flex justify-center items-center text-xs font-hind`
                  : `hidden`
              }
            >
              {unopenNotif < 0 ? `` : unopenNotif}
            </div>
            <div
              className={
                showNotif
                  ? `flex absolute top-5 right-12 cursor-pointer transform-gpu ease-in-out duration-300`
                  : `hidden`
              }
              onClick={() => setShowNotif(false)}
            >
              <UserNotification />
            </div>
          </div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center capitalize font-montserrat font-bold border-[1px] border-slate-300 ">
            {userData[0]?.User_Name[0]}
          </div>
        </div>
      </div>
    </nav>
  );
}

const UserNotification = () => {
  const [myNotification, setMyNotification] = useState<Notifications[]>([]);
  const { user } = useUserAuth();

  useEffect(() => {
    let unsubscribe: () => void;

    const getMyNotifications = async () => {
      try {
        if (!user?.uid) {
          console.log("Logged In First");

          return;
        }

        unsubscribe = Notifications.default(user?.uid || "", (newNotif) => {
          setMyNotification(newNotif);
        });
      } catch (error) {
        console.log(error);
      }
    };

    getMyNotifications();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  return (
    <div className="max-w-[500px] w-[482px] h-fit max-h-[542px] bg-white drop-shadow-lg rounded-xl justify-self-center flex flex-col  overflow-y-scroll">
      <h1 className="font-hind text-lg mx-4 mt-4 mb-2">Notifications</h1>
      <div className="h-0.5 border-[#393939] w-full border-[1px] mb-2" />
      {myNotification.map((data, index) => {
        return (
          <div
            key={index}
            className=" drop-shadow-lg grid grid-cols-12 p-2 items-center"
          >
            <div className="m-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <div className="grid grid-cols-12 my-2 col-span-11">
              <Link
                href={`/Transactions/${
                  data?.sitter_id
                    ? `MyOffer/${data?.sitter_id}`
                    : `MyRequests/${data?.requster_id}`
                }
                `}
                className={`col-span-11 ${
                  data?.hide ? `hidden` : `grid`
                } grid-cols-12`}
              >
                <div className="h-12 w-12 col-span-2 rounded-full bg-white drop-shadow-lg font-montserrat text-xs flex items-center justify-center text-center text-nowrap overflow-hidden">
                  Image of <br />
                  {data?.receiver_fullName}
                </div>
                <div className="flex flex-col gap-1 font-montserrat text-wrap col-span-10 text-sm">
                  <h1 className="text-[#393939] font-medium">
                    {data?.message}
                  </h1>
                  <p className="text-xs text-[#797979]">{data?.createdAt}</p>
                </div>
              </Link>
              <div className="flex justify-center mt-0.5 ">
                <FontAwesomeIcon icon={faEyeSlash} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
