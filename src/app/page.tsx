import InputForm from "@/components/InputForm";

export default async function Home() {
  return (
    <main className="flex flex-col flex-1 h-full items-center justify-center md:max-w-screen-md mx-auto p-4 md:px-8">
      <div className="w-full items-center align-center">
        <h1 className="w-full text-center text-3xl font-bold mb-4">
          AI Spanish Tutor
        </h1>

        <InputForm />
      </div>
    </main>
  );
}
