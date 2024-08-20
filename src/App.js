import { useGoogleLogin } from "@react-oauth/google";
import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import GoogleSvg from "./assets/google.svg";

function App() {
  const [event, setEvent] = useState([]);
  const localizer = momentLocalizer(moment);
  const [newCalendarId, setNewCalendarId] = useState("");
  const [user, setUser] = useState({});

  const [startDate, setStartDate] = useState(
    moment().startOf("month").format("DD-MM-YYYY")
  );
  const [endDate, setEndDate] = useState(
    moment().endOf("month").format("DD-MM-YYYY")
  );

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (JSON.parse(user)?.email) {
      setUser(JSON.parse(user));
      fetchCalendarEvent(JSON.parse(user)?.email, startDate, endDate);
    }
  }, []);

  const transformEvents = (events) => {
    return events.map((event, index) => {
      return {
        id: event.id,
        title: event.summary || "No Title",
        start: moment(event?.start?.dateTime || event?.start?.date).toDate(),
        end: moment(event?.end?.dateTime || event?.end?.date).toDate(),
      };
    });
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    onSuccess: async (response) => {
      await oauth2callback(response?.code);
    },
    onError: (errorResponse) => {
      console.log("errorResponse", errorResponse);
    },
  });

  const oauth2callback = async (code) => {
    try {
      setEvent([]);
      const response = await axios.post(
        "http://localhost:3001/auth/oauth2callback",
        {
          code,
        }
      );

      if (response.status) {
        localStorage.setItem("user", JSON.stringify(response?.data?.data));
        fetchCalendarEvent(response?.data?.data?.email, startDate, endDate);
      }
    } catch (error) {
      console.error("Error during google verification", error);
    }
  };

  const fetchCalendarEvent = async (email, startDate, endDate) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/auth/calendar-event",
        {
          email,
          startDate,
          endDate,
        }
      );
      if (response?.data?.data?.length > 0) {
        setEvent(transformEvents(response?.data?.data));
      }
    } catch (error) {
      console.error("Error feching events", error);
    }
  };

  const handleNavigate = (newDate, view) => {
    let startDate, endDate;
    if (view === "month") {
      startDate = moment(newDate).startOf("month").utc()
      endDate = moment(newDate).endOf("month").utc()
    } else if (view === "week") {
      startDate = moment(newDate).startOf("week").utc()
      endDate = moment(newDate).endOf("week").utc()
    } else if (view === "day") {
      startDate = moment(newDate).startOf("day").utc()
      endDate = moment(newDate).endOf("day").utc()
    }
    setStartDate(startDate);
    setEndDate(endDate);

    if (!!user?.email) fetchCalendarEvent(user?.email, startDate, endDate);
  };

  return (
    <>
      <div className="calendar-container">
        {!user?.email && (
          <button onClick={googleLogin} className="btn btn-icon">
            <img
              width={18}
              height={18}
              src={GoogleSvg}
              alt="Google Logo"
              className="google-icon"
            />
            <span>Config Google Calendar</span>
          </button>
        )}
        {user?.email && (
          <button
            onClick={() => {
              setUser({});
              setEvent();
            }}
            className="btn btn-logout"
          >
            Logout
          </button>
        )}
        {user?.email && (
          <>
            <div className="calendar-config">
              <div className="user-info">
                <div>Login User: {user?.email}</div>
              </div>
            </div>
            <div className="fetch-event">
              <button
                onClick={() =>
                  fetchCalendarEvent(user?.email, startDate, endDate)
                }
                className="btn btn-fetch"
              >
                Fetch Event
              </button>
            </div>
          </>
        )}
        <Calendar
          localizer={localizer}
          events={event}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onNavigate={handleNavigate}
          className="calendar"
        />
      </div>
    </>
  );
}

export default App;
