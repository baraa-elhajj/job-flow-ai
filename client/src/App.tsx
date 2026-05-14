import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import JobsList from "./pages/JobsList";
import JobDetails from "./pages/JobDetails";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/jobs" element={<JobsList source="hn" />} />
          <Route
            path="/jobs/linkedin"
            element={<JobsList source="linkedin" />}
          />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/linkedin/:id" element={<JobDetails />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
