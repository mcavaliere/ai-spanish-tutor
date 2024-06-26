import { Coffee, Github, Globe, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="absolute bottom-4 flex flex-row items-center justify-between w-full gap-2  px-4 md:px-8">
      <div className="flex flex-col whitespace-nowrap">
        <div className="flex flex-row mb-2 w-full">
          <span className="inline-block mr-2">Hecho con ❤️ por</span>
          <Link
            href="https://mikecavaliere.com"
            className="inline-block font-bold"
            target="_blank"
          >
            Mike Cavaliere
          </Link>
        </div>
        <ul role="list" className="flex flex-row w-full justify-center gap-4">
          <li role="list-item" className="flex">
            <Link href="https://twitter.com/mcavaliere" target="_blank">
              <Twitter className="size-4" />
            </Link>
          </li>
          <li role="list-item" className="flex">
            <Link
              href="https://www.linkedin.com/in/mikecavaliere"
              target="_blank"
            >
              <Linkedin className="size-4" />
            </Link>
          </li>
          <li role="list-item" className="flex">
            <Link href="https://github.com/mcavaliere" target="_blank">
              <Github className="size-4" />
            </Link>
          </li>
          <li role="list-item" className="flex">
            <Link href="https://mikecavaliere.com/" target="_blank">
              <Globe className="size-4" />
            </Link>
          </li>
        </ul>
      </div>
      <span className="flex flex-row items-center gap-2">
        <span>Source code available at</span>
        <Link
          passHref
          href="https://buy.stripe.com/bIY5nUag3bzC09O9AA"
          target="_blank"
          className="bg-foreground rounded-full p-1"
        >
          <Github className="size-4 stroke-background" />
        </Link>
      </span>
    </footer>
  );
}
