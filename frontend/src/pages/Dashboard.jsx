import React from "react";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";

const Dashboard = () => (
  <div className="flex flex-col flex-grow">
    <BannerSection />
    <Announcement />
  </div>
);

export default Dashboard;