import React, { useState, useEffect } from "react";
import Style from "./home.module.css";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";
import { defaultSolanaConfig } from "@web3modal/solana/react";
import { solana, solanaTestnet, solanaDevnet } from "@web3modal/solana/chains";
import { Switch, Typography } from "@mui/material";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletProvider } from "@solana/wallet-adapter-react";

const Home = () => {
  const [recieverAddress, setRecieverAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState(1);
  const [toggle, setToggle] = useState(false);
  const [provider, setProvider] = useState(null);
  const [senderAddress, setSenderAddress] = useState("");

  const projectId = "b99808495fb88a9489d8d9b6001e2d75";
  const chains = [solana, solanaTestnet, solanaDevnet];

  const metadata = {
    name: "ETH-SOL-Transfer",
    description: "AppKit Example",
    url: "https://web3modal.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  };

  const chainConfig = () => {
    if (!toggle) {
      console.log("ethrereumSepolia");
      const ethrereumSepolia = {
        chainId: 11155111,
        name: "Sepolia test network",
        currency: "SepoliaETH",
        explorerUrl: "https://sepolia.etherscan.io",
        rpcUrl: "https://sepolia.infura.io/v3/",
      };

      const ethersConfig = defaultConfig({
        metadata,
        enableEIP6963: true,
        enableInjected: true,
        enableCoinbase: true,
        rpcUrl: "https://sepolia.infura.io/v3/",
        defaultChainId: 11155111,
      });

      createWeb3Modal({
        ethersConfig,
        chains: [ethrereumSepolia],
        projectId,
        enableAnalytics: true,
      });
    } else {
      console.log("solanaConfig");
      const solanaConfig = defaultSolanaConfig({
        metadata,
        chains,
        projectId,
      });

      createWeb3Modal({
        solanaConfig,
        chains,
        projectId,
        wallets: [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
        ],
      });
    }
  };
  const connectWallet = async () => {
    try {
      if (toggle) {
        const wallets = solanaProviderOptions().wallets;

        if (wallets.length === 0) {
          throw new Error("No Solana wallets are configured or available.");
        }

        const wallet = wallets[0];

        await wallet.connect();

        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const publicKey = wallet.publicKey?.toString();

        if (!publicKey) {
          throw new Error("Failed to retrieve the public key from the wallet.");
        }

        setSenderAddress(publicKey);
        setProvider({ wallet, connection, publicKey });
      } else {
        const modal = new Web3Modal({
          cacheProvider: true,
          providerOptions: ethersProviderOptions(),
        });

        const instance = await modal.connect();
        const ethersProvider = new ethers.providers.Web3Provider(instance);
        await ethersProvider.send("eth_requestAccounts", []);
        let fromAddress = await ethersProvider.getSigner().getAddress();
        setSenderAddress(fromAddress);
        setProvider(ethersProvider);
      }
    } catch (error) {
      console.error("Connection failed:", error);
      alert(`Connection failed: ${error.message}`);
    }
  };

  const ethersProviderOptions = () => ({
    injected: {
      display: {
        logo: "https://example.com/ethereum-logo.png",
        name: "MetaMask",
        description: "Connect with MetaMask",
      },
      package: "ethers",
    },
  });

  const solanaProviderOptions = () => {
    const network = WalletAdapterNetwork.Devnet;
    const wallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];

    return {
      wallets,
      network,
      options: {
        autoConnect: false,
      },
    };
  };

  const handleEthereumTransfer = async () => {
    try {
      const signer = provider.getSigner();
      const tx = {
        to: recieverAddress,
        value: ethers.utils.parseEther(tokenAmount.toString()),
      };

      const transactionResponse = await signer.sendTransaction(tx);
      await transactionResponse.wait();
      alert(`Transaction successful: ${transactionResponse.hash}`);
    } catch (error) {
      console.error("Ethereum transaction failed:", error);
      alert(`Ethereum transaction failed: ${error.message}`);
    }
  };

  const handleSolanaTransfer = async () => {
    try {
      const { connection, wallet, publicKey } = provider;
      console.log(wallet);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(recieverAddress),
          lamports: tokenAmount * LAMPORTS_PER_SOL,
        })
      );
      transaction.feePayer = new PublicKey(publicKey);
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const signedTransaction = await wallet.signTransaction(transaction);

      const txid = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false }
      );
      await connection.confirmTransaction(txid, "confirmed");

      alert(`Transaction successful: ${txid}`);
    } catch (error) {
      console.error("Solana transaction failed:", error);
      alert(`Solana transaction failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(recieverAddress, tokenAmount);
    if (tokenAmount == 0) {
      alert("Amount Can't be a zero");
    }
    if (!toggle) {
      console.log("Ethereum");
      await handleEthereumTransfer();
    } else {
      console.log("Solana");
      await handleSolanaTransfer();
    }
  };

  useEffect(() => {
    chainConfig();
  }, [toggle]);

  return (
    <WalletProvider
      wallets={solanaProviderOptions().wallets}
      autoConnect={false}
    >
      <div>
        <div className={Style.walletBtn}>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
        <div>
          {!toggle ? "Ethereum" : "Solana"} : {senderAddress}
        </div>

        <div className={Style.formBox}>
          <div className={Style.toggleSwitch}>
            <Typography>Ethereum</Typography>
            <Switch
              checked={toggle}
              onChange={(e) => setToggle(e.target.checked)}
            />
            <Typography>Solana</Typography>
          </div>

          <form className={Style.formMain}>
            <input
              type="text"
              placeholder="Enter reciever Address"
              value={recieverAddress}
              onChange={(e) => setRecieverAddress(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Enter token amount"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              required
            />
            <button onClick={handleSubmit}>Submit</button>
          </form>
        </div>
      </div>
    </WalletProvider>
  );
};

export default Home;
