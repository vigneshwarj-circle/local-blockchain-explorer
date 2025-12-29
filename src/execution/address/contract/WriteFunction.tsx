import {
  Contract,
  FunctionFragment,
  parseUnits,
} from "ethers";
import React, {
  FormEvent,
  Fragment,
  useContext,
  useRef,
  useState,
} from "react";
import { useChainInfo } from "../../../useChainInfo";
import { useWallet } from "../../../useWallet";
import { RuntimeContext } from "../../../useRuntime";
import FunctionParamInput, {
  ParamComponentRef,
  ParamValue,
} from "./FunctionParamInput";
import { parseStructuredArgument } from "./ReadFunction";

type WriteFunctionProps = {
  address: string;
  func: FunctionFragment;
  devMethod?:
    | {
        details?: string;
        params?: Record<string, string>;
        returns?: Record<string, string>;
      }
    | undefined;
};


const WriteFunction: React.FC<WriteFunctionProps> = ({
  address,
  func,
  devMethod,
}) => {
  const { provider: readProvider } = useContext(RuntimeContext);
  const { provider: walletProvider, account, connect } = useWallet();
  const [value, setValue] = useState<string>("");
  const [result, setResult] = useState<{
    hash: string;
    confirmations: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const childRefs = useRef<ParamComponentRef[]>([]);

  const {
    nativeCurrency: { name: nativeCurrency },
  } = useChainInfo();

  async function submitTransaction() {
    if (!walletProvider || !account) {
      setError("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const signer = await walletProvider.getSigner();
      const contract = new Contract(address, [func], signer);

      // Parse input parameters
      const inputTree: ParamValue[] = childRefs.current.map((childRef) =>
        childRef.computeParamValue(),
      );
      const parsedInputs = await Promise.all(
        inputTree.map((input: ParamValue, i: number) =>
          parseStructuredArgument(input, func.inputs[i], i, readProvider),
        ),
      );

      // Prepare transaction options
      const txOptions: any = {};
      if (value !== "") {
        txOptions.value = parseUnits(value, 18);
      }

      // Send transaction
      const tx = await contract[func.name](...parsedInputs, txOptions);
      setResult({ hash: tx.hash, confirmations: 0 });

      // Wait for confirmation
      const receipt = await tx.wait();
      if (receipt) {
        setResult({ hash: tx.hash, confirmations: 1 });
      }
    } catch (e: any) {
      console.error("Transaction failed:", e);
      setError(e.message || e.toString());
    } finally {
      setIsSubmitting(false);
    }
  }

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    submitTransaction();
  }

  return (
    <li key={func.format()} className="pb-4">
      <form onSubmit={onFormSubmit}>
        <div className="flex items-baseline space-x-1 pb-2">
          <span className="text-sm font-bold">{func.name}</span>
        </div>
        {devMethod && devMethod.details && (
          <div className="pb-2 text-sm text-gray-600">{devMethod.details}</div>
        )}
        <div className="space-y-2 pb-2">
          {func.inputs.map((input, i) => (
            <Fragment key={i}>
              <FunctionParamInput
                ref={(el) => {
                  if (el) childRefs.current[i] = el;
                }}
                param={input}
              />
              {devMethod?.params?.[input.name] && (
                <div className="text-xs text-gray-500">
                  {devMethod.params[input.name]}
                </div>
              )}
            </Fragment>
          ))}
          {func.payable && (
            <div>
              <label className="text-sm font-medium">
                payableAmount ({nativeCurrency})
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.0"
              />
            </div>
          )}
        </div>

        {account ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Write"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => connect(readProvider._network.chainId)}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Connect Wallet
          </button>
        )}

        {error && (
          <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-2 rounded bg-green-50 p-2 text-sm">
            <div className="font-medium text-green-800">
              Transaction submitted!
            </div>
            <div className="break-all text-green-700">
              Hash: {result.hash}
            </div>
            <div className="text-green-700">
              {result.confirmations > 0
                ? `Confirmed (${result.confirmations} confirmations)`
                : "Waiting for confirmation..."}
            </div>
          </div>
        )}
      </form>
    </li>
  );
};

export default WriteFunction;

