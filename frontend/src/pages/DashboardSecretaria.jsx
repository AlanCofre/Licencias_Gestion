import React from "react";
import BannerSectionSecretaria from "../components/BannerSectionSecretaria";
import Announcement from "../components/Announcement";

const DashboardSecretaria = () => (
  <div className="flex flex-col flex-grow">
    <BannerSectionSecretaria />
    <Announcement />
  </div>
);

export default DashboardSecretaria;