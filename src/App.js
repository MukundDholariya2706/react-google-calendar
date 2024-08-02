import { useGoogleLogin } from "@react-oauth/google";
import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

function App() {
  const [event, setEvent] = useState([]);
  const localizer = momentLocalizer(moment);
  const [startDate, setStartDate] = useState(moment().startOf("month").format("DD-MM-YYYY"));
  const [endDate, setEndDate] = useState(moment().endOf("month").format("DD-MM-YYYY"));
  const [events, setEvents] = useState([]);

  useEffect(() => {
    console.log(events, "events");
  }, [events]);

  const transformEvents = (events) => {
    return events.map((event, index) => {
      return {
        id: event.id,
        title: event.summary || "No Title",
        start: moment(event.start.dateTime || event.start.date, 'YYYY-MM-DD').toDate(),
        end: moment(event.end.dateTime || event.end.date, 'YYYY-MM-DD').toDate(),
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

      if (response.status) {
        fetchCalendarEvent(response?.data?.data?.email);
      }

      // if (response?.data?.length > 0) {
      //   console.log(transformEvents(response?.data), "transformEvents");
      //   setEvent(transformEvents(response?.data));
      // }
    } catch (error) {
      console.error("Error during google verification", error);
    }
  };

  const fetchCalendarEvent = async (email) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/auth/calendar-event",
        {
          email,
          startDate,
          endDate
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
      setStartDate(startDate);
      setEndDate(endDate);
    } else if (view === "week") {
      startDate = moment(newDate).startOf("week").format("DD-MM-YYYY");
      endDate = moment(newDate).endOf("week").format("DD-MM-YYYY");
      setStartDate(startDate);
      setEndDate(endDate);
    } else if (view === "day") {
      startDate = moment(newDate).startOf("day").format("DD-MM-YYYY");
      endDate = moment(newDate).endOf("day").format("DD-MM-YYYY");
      setStartDate(startDate);
      setEndDate(endDate);
    }
  };

  return (
    <>
      <div className="App">
        <div className="App-header">
          <button onClick={googleLogin}>Config Google Calendar</button>
          <button onClick={() => fetchCalendarEvent('mukunddtridhyatech@gmail.com')}>"mukunddtridhyatech@gmail.com" Get Events</button>
          <button onClick={() => fetchCalendarEvent('mukund.d@tridhyatech.com')}>"mukund.d@tridhyatech.com" Get Events</button>
          <Calendar
            localizer={localizer}
            events={event}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onNavigate={handleNavigate}
          />
          {/* {event &&
            event.length > 0 &&
            event?.map((event, index) => (
              <div key={index}>
                <h3>{event.summary}</h3>
                <p>
                  {event.start.dateTime || event.start.date} -{" "}
                  {event.end.dateTime || event.end.date}
                </p>
              </div>
            ))}
          {event.length == 0 && <div>No Event</div>} */}
        </div>
      </div>
    </>
  );
}

export default App;
