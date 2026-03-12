"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { RemoteStorage } from "remote-storage"

import { Button } from "@/components/ui/button"

type ShoppingAd = {
  id: number
  title: string
  street: string
  details: string
  preferredTime: string
  contact: string
}

const ADS_STORAGE_KEY = "shopping-ads"
const SHARED_REMOTE_USER_ID = "my-website-community-board"

export default function Page() {
  const [title, setTitle] = useState("Need help with grocery shopping")
  const [street, setStreet] = useState("")
  const [details, setDetails] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [contact, setContact] = useState("")
  const [ads, setAds] = useState<ShoppingAd[]>([])
  const [notice, setNotice] = useState("")
  const [isRemoteReady, setIsRemoteReady] = useState(false)
  const remoteStorageRef = useRef<RemoteStorage | null>(null)

  useEffect(() => {
    async function loadAds() {
      try {
        const remoteStorage = new RemoteStorage({
          serverAddress: "https://remote-storage.xiduzo.com/",
          userId: SHARED_REMOTE_USER_ID,
          instanceId: "my-website-shopping-board",
        })

        remoteStorageRef.current = remoteStorage
        setIsRemoteReady(true)

        const remoteAds = await remoteStorage.getItem<ShoppingAd[]>(ADS_STORAGE_KEY)
        if (Array.isArray(remoteAds)) {
          setAds(remoteAds)
        }
      } catch {
        setNotice(
          "Could not connect to remote storage right now. You can still post, and try again shortly.",
        )
      }
    }

    void loadAds()
  }, [])

  const matchingAds = useMemo(() => {
    if (!street.trim()) {
      return ads
    }

    return ads.filter(
      (ad) => ad.street.toLowerCase() === street.trim().toLowerCase(),
    )
  }, [ads, street])

  async function persistAds(nextAds: ShoppingAd[]) {
    if (!remoteStorageRef.current) {
      return
    }

    await remoteStorageRef.current.setItem(ADS_STORAGE_KEY, nextAds)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedStreet = street.trim()
    const trimmedDetails = details.trim()
    const trimmedContact = contact.trim()

    if (!trimmedStreet || !trimmedDetails || !trimmedContact) {
      setNotice("Please fill in street, shopping details, and contact info.")
      return
    }

    const newAd: ShoppingAd = {
      id: Date.now(),
      title: title.trim() || "Need help with grocery shopping",
      street: trimmedStreet,
      details: trimmedDetails,
      preferredTime: preferredTime.trim() || "Flexible",
      contact: trimmedContact,
    }

    setAds((currentAds) => {
      const nextAds = [newAd, ...currentAds]

      void persistAds(nextAds)
        .then(() => {
          setNotice(`Your ad is now visible to neighbors on ${trimmedStreet}.`)
        })
        .catch(() => {
          setNotice(
            "Your ad was added, but syncing to remote storage failed. Please try again.",
          )
        })

      return nextAds
    })

    if (!isRemoteReady) {
      setNotice(
        "Ad created locally while remote storage connects. It will sync when connection is available.",
      )
    }

    setDetails("")
    setPreferredTime("")
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_right,#f9d6a8_0%,#f2efe8_40%,#e2f0ee_100%)] px-4 py-8 text-stone-900 md:px-8">
      <section className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-stone-300 bg-white/85 p-6 shadow-xl backdrop-blur md:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.15em] text-stone-600">
            Community helper board
          </p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Post an ad for shopping help from your street
          </h1>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-stone-700 md:text-lg">
            Write a short message so nearby neighbors can offer to help with your
            grocery shopping.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-base font-medium">Ad title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-stone-500 focus:outline-none"
                placeholder="Need help with grocery shopping"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-base font-medium">Street</span>
              <input
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-stone-500 focus:outline-none"
                placeholder="Example: Oak Street"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-base font-medium">
                What do you need from the shop?
              </span>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-stone-500 focus:outline-none"
                placeholder="Milk, bread, apples, and medicine from the pharmacy."
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-base font-medium">
                Preferred day or time
              </span>
              <input
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-stone-500 focus:outline-none"
                placeholder="Tomorrow morning"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-base font-medium">
                How can neighbors contact you?
              </span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-stone-500 focus:outline-none"
                placeholder="Phone number or apartment bell name"
                required
              />
            </label>

            <Button className="h-12 rounded-xl bg-stone-900 px-6 text-base hover:bg-stone-700">
              Post my ad
            </Button>
          </form>

          {notice ? (
            <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-base text-emerald-800">
              {notice}
            </p>
          ) : null}
        </div>

        <aside className="rounded-3xl border border-stone-300 bg-white/85 p-6 shadow-xl backdrop-blur md:p-8">
          <h2 className="text-2xl font-semibold">Local ads</h2>
          <p className="mt-2 text-sm text-stone-700">
            {street.trim()
              ? `Showing requests from ${street.trim()}.`
              : "Add your street to filter local requests."}
          </p>
          <p className="mt-1 text-xs text-stone-600">
            {isRemoteReady
              ? "Remote storage connected"
              : "Connecting to remote storage..."}
          </p>

          <div className="mt-4 space-y-3">
            {matchingAds.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                No ads yet. Post one and it will appear here.
              </p>
            ) : (
              matchingAds.map((ad) => (
                <article
                  key={ad.id}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3"
                >
                  <h3 className="text-base font-semibold">{ad.title}</h3>
                  <p className="mt-1 text-sm text-stone-700">{ad.details}</p>
                  <p className="mt-2 text-sm text-stone-600">
                    <strong>Street:</strong> {ad.street}
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Time:</strong> {ad.preferredTime}
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Contact:</strong> {ad.contact}
                  </p>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}
