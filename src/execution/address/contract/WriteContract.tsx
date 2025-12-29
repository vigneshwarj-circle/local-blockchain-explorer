import { FunctionFragment } from "ethers";
import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router";
import ContentFrame from "../../../components/ContentFrame";
import StandardSelectionBoundary from "../../../selection/StandardSelectionBoundary";
import { Match, MatchType } from "../../../sourcify/useSourcify";
import { usePageTitle } from "../../../useTitle";
import { useWallet } from "../../../useWallet";
import { RuntimeContext } from "../../../useRuntime";
import WhatsabiWarning from "../WhatsabiWarning";
import WriteFunction from "./WriteFunction";
import myAbi from "../../../abi/myabi.json";

type ContractsProps = {
  checksummedAddress: string;
  match: Match | null | undefined;
};

// Map of specific contract addresses to custom ABIs that should be used for the
// "Write Contract" UI. Keys must be checksummed addresses.
const CUSTOM_WRITE_ABIS: Record<string, any[]> = {
  // Example (replace with your contract address):
  "0x7FB8c7260b63934d8da38aF902f87ae6e284a845": myAbi,
};

export function isWriteFunction(abiFn: {
  type: string;
  stateMutability: string;
}) {
  return (
    abiFn.type === "function" &&
    abiFn.stateMutability !== "pure" &&
    abiFn.stateMutability !== "view"
  );
}

const WriteContract: React.FC<ContractsProps> = ({
  checksummedAddress,
  match,
}) => {
  const { provider } = useContext(RuntimeContext);
  const { chainId: walletChainId } = useWallet();

  const customAbi = CUSTOM_WRITE_ABIS[checksummedAddress];
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

  usePageTitle(`Write Contract | ${checksummedAddress}`);

  const writeFunctions = effectiveMatch?.metadata.output.abi.filter((fn) =>
    isWriteFunction(fn),
  );

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

  // Check if wallet is connected to the same chain
  const chainMismatch =
    walletChainId !== null && walletChainId !== provider._network.chainId;

  return (
    <StandardSelectionBoundary>
      <ContentFrame tabs>
        {effectiveMatch && effectiveMatch.type === MatchType.WHATSABI_GUESS && (
          <WhatsabiWarning />
        )}

        {chainMismatch && (
          <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-50 p-4">
            <div className="font-medium text-yellow-800">
              ⚠️ Chain Mismatch
            </div>
            <div className="text-sm text-yellow-700">
              Your wallet is connected to chain ID {walletChainId.toString()},
              but you're viewing chain ID {provider._network.chainId.toString()}
              . Please switch your wallet to the correct network.
            </div>
          </div>
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

          {writeFunctions && (
            <div>
              {writeFunctions.length === 0 && (
                <div>
                  <p className="pb-2">
                    This contract has no external write functions.
                  </p>
                  <p className="text-sm text-gray-500">
                    Note: Only non-view and non-pure functions are displayed
                    here. View and pure functions can be found in the "Read
                    Contract" tab.
                  </p>
                </div>
              )}
              {writeFunctions.length > 0 && (
                <>
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="font-medium text-blue-800">
                      💡 How to use Write Contract
                    </div>
                    <ol className="mt-2 list-inside list-decimal text-sm text-blue-700">
                      <li>Connect your wallet (e.g., MetaMask)</li>
                      <li>Fill in the function parameters</li>
                      <li>Click "Write" to submit the transaction</li>
                      <li>Confirm the transaction in your wallet</li>
                    </ol>
                  </div>
                  <ol className="marker:text-md list-inside list-decimal marker:text-gray-400">
                    {writeFunctions.map((fn, i) => (
                      <WriteFunction
                        func={FunctionFragment.from(fn)}
                        address={checksummedAddress}
                        devMethod={
                          effectiveMatch?.metadata?.output?.devdoc?.methods?.[
                            FunctionFragment.from(fn).format("sighash")
                          ]
                        }
                        key={i}
                      />
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      </ContentFrame>
    </StandardSelectionBoundary>
  );
};

export default React.memo(WriteContract);

