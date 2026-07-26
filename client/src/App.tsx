import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import JobDetails from "./pages/JobDetails";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home source="all"/>} />
          <Route path="/linkedin" element={<Home source="linkedin"/>} />
          <Route path="/hnhiring" element={<Home source="hnhiring"/>} />
          <Route path="/bayt" element={<Home source="bayt"/>} />
          <Route path="/jobs/:id" element={<JobDetails />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
