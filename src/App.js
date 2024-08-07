import { useGoogleLogin } from "@react-oauth/google";
import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

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
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // console.log(events, "events");
  }, [events]);

  const transformEvents = (events) => {
    return events.map((event, index) => {
      return {
        id: event.id,
        title: event.summary || "No Title",
        start: moment(
          event?.start?.dateTime || event?.start?.date,
        ).toDate(),
        end: moment(
          event?.end?.dateTime || event?.end?.date,
        ).toDate(),
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

      // if (response?.data?.length > 0) {
      //   console.log(transformEvents(response?.data), "transformEvents");
      //   setEvent(transformEvents(response?.data));
      // }
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
        console.log(transformEvents(response?.data?.data), 'transformEvents(response?.data?.data)')
      }
    } catch (error) {
      console.error("Error feching events", error);
    }
  };

  const handleNavigate = (newDate, view) => {
    let startDate, endDate;
    console.log(newDate, view, "view");
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
      console.log(response, "response");
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
      <div className="App">
        {!user?.email && (
          <button onClick={googleLogin}>Config Google Calendar</button>
        )}
        {user?.email && (
          <button
            onClick={() => {
              setUser({});
              setEvent();
            }}
          >
            Logout
          </button>
        )}
        {user?.email && (
          <>
            <div>
              <h3>Add New Calendar ID</h3>
              <div>Login User: {user?.email}; Calendar ID: </div>
              <div>
                {user?.calendarId?.length != 0 &&
                  user?.calendarId?.map((calendarId) => {
                    return <span>{calendarId},</span>;
                  })}
              </div>
              <div>
                <label>New Calendar ID: </label>
                <input
                  type="text"
                  value={newCalendarId}
                  onChange={(e) => setNewCalendarId(e.target.value)}
                  placeholder="Enter new calendar ID"
                />
              </div>
              <button onClick={handleAddCalendarId}>Add Calendar ID</button>
            </div>
            <div className="App-header">
              <button
                onClick={() =>
                  fetchCalendarEvent(user?.email, startDate, endDate)
                }
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
        />
      </div>
    </>
  );
}

export default App;
