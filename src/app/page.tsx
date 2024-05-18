import InputForm from "@/components/InputForm";

export default async function Home() {
  return (
    <main className="flex min-h-screen p-4 h-full flex-col items-center justify-center p-24">
      <h1 className="text-center text-3xl font-bold mb-4">AI Spanish Tutor</h1>

      <div className="md:max-w-screen-md h-full w-full mx-auto">
        <InputForm />
      </div>
    </main>
  );
}
