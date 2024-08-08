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
    console.log(event, "event");
  }, [event]);

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
      await getCalendarEvent(response?.code);
    },
    onError: (errorResponse) => {
      console.log("errorResponse", errorResponse);
    },
  });

  const getCalendarEvent = async (code) => {
    try {
      setEvent([]);
      const response = await axios.post(
        "http://localhost:3001/auth/oauth2callback",
        {
          code,
        }
      );

      setUser(response?.data?.data);
      if (response.status) {
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
      startDate = moment(newDate).startOf("month").format("DD-MM-YYYY");
      endDate = moment(newDate).endOf("month").format("DD-MM-YYYY");
    } else if (view === "week") {
      startDate = moment(newDate).startOf("week").format("DD-MM-YYYY");
      endDate = moment(newDate).endOf("week").format("DD-MM-YYYY");
    } else if (view === "day") {
      startDate = moment(newDate).startOf("day").format("DD-MM-YYYY");
      endDate = moment(newDate).endOf("day").format("DD-MM-YYYY");
    }
    setStartDate(startDate);
    setEndDate(endDate);

    if (!!user?.email) fetchCalendarEvent(user?.email, startDate, endDate);
  };

  const handleAddCalendarId = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/auth/add-calendar-id",
        { email: user?.email, newCalendarId }
      );
      if (response?.data?.status) {
        setNewCalendarId("");
        setUser(response?.data?.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="calendar-container">
        {!user?.email && (
          <button onClick={googleLogin} className="btn btn-icon">
            <img width={18} height={18} src={GoogleSvg} alt="Google Logo" className="google-icon" />
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
              <h3>Add New Calendar ID</h3>
              <div className="user-info">
                <div>Login User: {user?.email}</div>
                <div>
                  Calendar ID:
                  {user?.calendarId?.length !== 0 &&
                    user?.calendarId?.map((calendarId, index) => (
                      <span key={index} className="calendar-id">
                        {calendarId},
                      </span>
                    ))}
                </div>
              </div>
              <div className="new-calendar-id">
                <label>New Calendar ID:</label>
                <input
                  type="text"
                  value={newCalendarId}
                  onChange={(e) => setNewCalendarId(e.target.value)}
                  placeholder="Enter new calendar ID"
                  className="input-field"
                />
              </div>
              <button onClick={handleAddCalendarId} className="btn btn-add">
                Add Calendar ID
              </button>
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
