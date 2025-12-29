import { FC } from "react";
import { useOutletContext } from "react-router";
import { type AddressOutletContext } from "../AddressMainPage";
import WriteContract from "./contract/WriteContract";

const AddressWriteContract: FC = () => {
  const { address, match, whatsabiMatch } =
    useOutletContext() as AddressOutletContext;
  return (
    <WriteContract
      checksummedAddress={address}
      match={match ?? whatsabiMatch}
    />
  );
};

export default AddressWriteContract;

