import { FunctionFragment } from "ethers";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import ContentFrame from "../../../components/ContentFrame";
import LabeledSwitch from "../../../components/LabeledSwitch";
import StandardSelectionBoundary from "../../../selection/StandardSelectionBoundary";
import { Match, MatchType } from "../../../sourcify/useSourcify";
import { usePageTitle } from "../../../useTitle";
import WhatsabiWarning from "../WhatsabiWarning";
import ReadFunction from "./ReadFunction";
import myAbi from "../../../abi/myabi.json";

type ContractsProps = {
  checksummedAddress: string;
  match: Match | null | undefined;
};

// Map of specific contract addresses to custom ABIs that should be used for the
// "Read Contract" UI. Keys must be checksummed addresses.
const CUSTOM_READ_ABIS: Record<string, any[]> = {
  // Example (replace with your contract address):
  "0x7FB8c7260b63934d8da38aF902f87ae6e284a845": myAbi,
};

export function isReadFunction(abiFn: {
  type: string;
  stateMutability: string;
}) {
  return (
    abiFn.type === "function" &&
    (abiFn.stateMutability === "pure" || abiFn.stateMutability === "view")
  );
}

const ReadContract: React.FC<ContractsProps> = ({
  checksummedAddress,
  match,
}) => {
  const customAbi = CUSTOM_READ_ABIS[checksummedAddress];
  const effectiveMatch: Match | null | undefined = customAbi
    ? {
        type: MatchType.FULL_MATCH,
        metadata: {
          version: "custom",
          language: "Solidity",
          compiler: { version: "custom" },
          sources: {},
          output: {
            abi: customAbi,
          },
        },
      }
    : match;

  const [showNonViewReturns, setShowNonViewReturns] = useState<boolean>(false);
  usePageTitle(`Read Contract | ${checksummedAddress}`);

  const viewFunctions = effectiveMatch?.metadata.output.abi.filter((fn) =>
    isReadFunction(fn),
  );
  const nonViewReturns = effectiveMatch?.metadata.output.abi.filter(
    (fn) => fn.outputs && fn.outputs.length > 0 && !isReadFunction(fn),
  );
  const showDecodedOutputs =
    effectiveMatch?.type !== MatchType.WHATSABI_GUESS;

  const location = useLocation();
  useEffect(() => {
    setTimeout(() => {
      if (location.hash) {
        // Scroll to fragment, e.g. "#0xabcdef01"
        let foundElement = document.getElementById(location.hash.slice(1));
        if (foundElement) {
          foundElement.scrollIntoView({
            behavior: "smooth",
          });
        }
      }
    }, 200);
  }, [effectiveMatch, location.hash]);

  return (
    <StandardSelectionBoundary>
      <ContentFrame tabs>
        {effectiveMatch && effectiveMatch.type === MatchType.WHATSABI_GUESS && (
          <WhatsabiWarning />
        )}
        <div className="py-5">
          {effectiveMatch === undefined && (
            <span>Getting data from Sourcify repository...</span>
          )}
          {effectiveMatch === null && (
            <span>
              Address is not a contract or couldn't find contract metadata in
              Sourcify repository.
            </span>
          )}

          {viewFunctions && (
            <div>
              {viewFunctions.length === 0 &&
                "This contract has no external view functions."}
              {(viewFunctions.length > 0 ||
                (nonViewReturns && nonViewReturns.length > 0)) && (
                <ol className="marker:text-md list-inside list-decimal marker:text-gray-400">
                  {viewFunctions.map((fn, i) => (
                    <ReadFunction
                      func={FunctionFragment.from(fn)}
                      address={checksummedAddress}
                      devMethod={
                        effectiveMatch?.metadata?.output?.devdoc?.methods?.[
                          FunctionFragment.from(fn).format("sighash")
                        ]
                      }
                      showDecodedOutputs={showDecodedOutputs}
                      key={i}
                    />
                  ))}
                  {nonViewReturns && nonViewReturns.length > 0 && (
                    <>
                      <LabeledSwitch
                        defaultEnabled={showNonViewReturns}
                        onToggle={setShowNonViewReturns}
                      >
                        Show non-view functions with return values
                      </LabeledSwitch>
                      {showNonViewReturns && (
                        <>
                          <hr className="pb-4" />
                          {nonViewReturns.map((fn, i) => (
                            <ReadFunction
                              func={FunctionFragment.from(fn)}
                              address={checksummedAddress}
                              devMethod={
                                effectiveMatch?.metadata?.output?.devdoc?.methods?.[
                                  FunctionFragment.from(fn).format("sighash")
                                ]
                              }
                              showDecodedOutputs={showDecodedOutputs}
                              key={i}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </ol>
              )}
            </div>
          )}
        </div>
      </ContentFrame>
    </StandardSelectionBoundary>
  );
};

export default React.memo(ReadContract);
