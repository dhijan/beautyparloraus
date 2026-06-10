import { useState } from "react";
import { Link } from "react-router-dom";
import { locationCards } from "../data/pageData";
import { sendContactMessage } from "../api/contactApi";

function Contact() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      setSending(true);
      setShowSuccess(false);
      setErrorMessage("");
      setSuccessMessage("");

      const formData = new FormData(form);

      const payload = {
        fullName: String(formData.get("c-name") || ""),
        email: String(formData.get("c-email") || ""),
        subject: String(formData.get("c-subject") || ""),
        message: String(formData.get("c-message") || ""),
      };

      if (
        !payload.fullName.trim() ||
        !payload.email.trim() ||
        !payload.subject.trim() ||
        !payload.message.trim()
      ) {
        setErrorMessage("Please fill in all message fields.");
        return;
      }

      const result = await sendContactMessage(payload);

      setShowSuccess(true);
      setSuccessMessage(
        result.emailSent === false
          ? "Message saved. Email delivery is not configured, so please check the admin records."
          : "Message sent! We'll be in touch within 24 hours."
      );
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="page-banner">
        <div className="page-banner-overlay"></div>

        <div className="page-banner-content">
          <span className="section-label light">Get In Touch</span>

          <h1>
            Contact <em>&amp; Book</em>
          </h1>

          <nav aria-label="breadcrumb">
            <ol className="breadcrumb justify-content-center">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Contact
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Get In Touch</span>

            <h2 className="section-title">
              We'd Love to <em>Hear From You</em>
            </h2>

            <p className="section-desc">
              Questions, feedback, or just want to say hello? Drop us a message.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-cards">
              <div className="contact-info-card">
                <div className="cic-icon">
                  <i className="fa-solid fa-phone"></i>
                </div>

                <h4>Call Us</h4>

                <p>
                  Roselands: 0426 962 461
                  <br />
                  Hurstville: 0414 205 503
                  <br />
                  Hornsby: 02 8417 0814
                </p>

                <a href="tel:0426962461">Call Roselands</a>
              </div>

              <div className="contact-info-card">
                <div className="cic-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>

                <h4>Email Us</h4>

                <p>eyebrowbeautyhub@gmail.com</p>

                <a href="mailto:eyebrowbeautyhub@gmail.com">Send Email</a>
              </div>

              <div className="contact-info-card">
                <div className="cic-icon">
                  <i className="fa-brands fa-instagram"></i>
                </div>

                <h4>Follow Us</h4>

                <p>@eyebrowbeautyhub</p>

                <a
                  href="https://www.instagram.com/eyebrowbeautyhub/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </div>

              <div className="contact-info-card">
                <div className="cic-icon">
                  <i className="fa-regular fa-clock"></i>
                </div>

                <h4>Opening Hours</h4>

                <p>
                  Mon–Sat: 9am–7pm
                  <br />
                  Sun: 10am–5pm
                </p>

                <a href="#booking">Book Now</a>
              </div>
            </div>

            <div className="contact-form-wrap">
              <form
                className="contact-form"
                id="contact-form"
                onSubmit={handleContactSubmit}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="c-name">Your Name</label>
                    <input
                      type="text"
                      id="c-name"
                      name="c-name"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-email">Email Address</label>
                    <input
                      type="email"
                      id="c-email"
                      name="c-email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="c-subject">Subject</label>
                  <input
                    type="text"
                    id="c-subject"
                    name="c-subject"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="c-message">Message</label>
                  <textarea
                    id="c-message"
                    name="c-message"
                    rows={5}
                    placeholder="Write your message here..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary full-width" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </button>

                {showSuccess && (
                  <div className="form-success" id="contact-success">
                    <i className="fa-solid fa-circle-check"></i>{" "}
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="form-error">
                    <i className="fa-solid fa-circle-exclamation"></i> {errorMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="booking" id="booking">
        <div className="container">
          <div className="booking-grid">
            <div className="booking-info">
              <span className="section-label light">Book With Us</span>

              <h2 className="section-title light">
                Ready to Book Your <em>Appointment?</em>
              </h2>

              <p>
                Booking is simple and convenient. Select your preferred location
                below and book online instantly — or call us directly. Walk-ins
                welcome, subject to availability.
              </p>

              <div className="contact-details">
                <div className="contact-item">
                  <i className="fa-solid fa-phone"></i>

                  <div>
                    <strong>Call Us</strong>
                    <span>Roselands: 0426 962 461</span>
                    <span>Hurstville: 0414 205 503</span>
                    <span>Hornsby: 02 8417 0814</span>
                  </div>
                </div>

                <div className="contact-item">
                  <i className="fa-solid fa-envelope"></i>

                  <div>
                    <strong>Email Us</strong>
                    <span>eyebrowbeautyhub@gmail.com</span>
                  </div>
                </div>

                <div className="contact-item">
                  <i className="fa-solid fa-location-dot"></i>

                  <div>
                    <strong>4 Locations</strong>
                    <span>Roselands · Hurstville L2/L3 · Hornsby</span>
                  </div>
                </div>

                <div className="contact-item">
                  <i className="fa-regular fa-clock"></i>

                  <div>
                    <strong>Opening Hours</strong>
                    <span>Mon–Sat: 9am – 7pm | Sun: 10am – 5pm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-locations-wrap">
              <h3>Choose Your Location</h3>

              {locationCards.map((location) => (
                <div className="booking-loc-card" key={location.name}>
                  <div className="booking-loc-info">
                    <h4>
                      <i className="fa-solid fa-location-dot"></i>{" "}
                      {location.name}
                    </h4>

                    <span>{location.address.replace("\n", " · ")}</span>
                    <span>{location.phone}</span>

                    {location.note && (
                      <span className="booking-loc-note">
                        <i className="fa-solid fa-circle-info"></i>{" "}
                        {location.note}
                      </span>
                    )}
                  </div>

                  <a
                    href={location.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Book Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;
