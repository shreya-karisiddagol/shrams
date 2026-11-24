import { useState } from 'react'
import toast from 'react-hot-toast'
import { studentService } from '../../services/api'
import { ChevronDownIcon, ChevronUpIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

const RULES = [
  'Students must carry their ID cards at all times within hostel premises.',
  'Visitors are not allowed inside the hostel rooms. They may meet students in the common room only during visiting hours (10 AM – 6 PM).',
  'Ragging of any kind is strictly prohibited and will result in immediate expulsion.',
  'Students must maintain cleanliness in their rooms and common areas.',
  'Lights off by 11:00 PM on weekdays.',
  'No cooking is allowed inside rooms. Use the designated kitchen area.',
  'Loud music or noise is prohibited after 10:00 PM.',
  'Electricity and water should not be wasted.',
  'Damage to hostel property will be charged to the student.',
  'Students must report maintenance issues via the official portal.',
]

const FACILITIES = [
  { icon: '📶', name: 'High-Speed WiFi', desc: '24/7 internet connectivity' },
  { icon: '🧺', name: 'Laundry Room', desc: 'Washing machines available' },
  { icon: '🍽️', name: 'Mess / Canteen', desc: 'Nutritious meals served daily' },
  { icon: '📚', name: 'Study Room', desc: 'Quiet study spaces available' },
  { icon: '🏋️', name: 'Gym', desc: 'Basic fitness equipment' },
  { icon: '⚕️', name: 'Medical Room', desc: 'First aid and basic medical care' },
  { icon: '🔒', name: '24/7 Security', desc: 'Round-the-clock security staff' },
  { icon: '⚡', name: 'Power Backup', desc: 'Uninterrupted power supply' },
]

const FAQS = [
  { q: 'How do I apply for a hostel?', a: 'Go to "Apply for Hostel" in the sidebar and fill out the multi-step application form with your preferences.' },
  { q: 'When will I know if my application is approved?', a: 'The warden reviews applications within 2–3 working days. You will receive a notification once a decision is made.' },
  { q: 'Can I change my room after allocation?', a: 'Yes, you can submit a room change request from the "Room Allocation" page. The warden will review and approve based on availability.' },
  { q: 'How do I submit a maintenance complaint?', a: 'Go to "Complaints" and click "New Complaint". Describe the issue, select a category, and optionally upload images.' },
  { q: 'What are the visiting hours?', a: 'Visitors can meet students in the common room between 10 AM and 6 PM on all days.' },
  { q: 'Can I vacate the hostel mid-semester?', a: 'Yes, submit a vacating request from the "Room Allocation" page with the expected vacating date and reason.' },
  { q: 'What happens if I damage hostel property?', a: 'You will be charged for the repair or replacement cost. Serious damage may lead to disciplinary action.' },
  { q: 'Is there a curfew?', a: 'Yes. Students must return to the hostel by 9:00 PM on weekdays and 10:00 PM on weekends.' },
]

function Accordion({ items, renderQ, renderA }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm">{renderQ(item)}</span>
            {open === i ? <ChevronUpIcon className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-gray-600 bg-gray-50 leading-relaxed">
              {renderA(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ServicesPage() {
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackRating) return toast.error('Please select a rating')
    setSubmitting(true)
    try {
      await studentService.submitFeedbackGeneral({ rating: feedbackRating, comment: feedbackComment })
      toast.success('Thank you for your feedback!')
      setSubmitted(true)
    } catch { toast.error('Failed to submit feedback') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Services</h1>
        <p className="text-gray-500 text-sm">Rules, facilities, FAQs and feedback</p>
      </div>

      {/* Facilities */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏢 Hostel Facilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FACILITIES.map(f => (
            <div key={f.name} className="card text-center hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="font-semibold text-sm text-gray-900">{f.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Hostel Rules</h2>
        <Accordion
          items={RULES}
          renderQ={(r) => r}
          renderA={(r) => r}
        />
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">❓ Frequently Asked Questions</h2>
        <Accordion
          items={FAQS}
          renderQ={(f) => f.q}
          renderA={(f) => f.a}
        />
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📞 Important Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Hostel Office', phone: '0800-HOSTEL', email: 'hostel@university.edu', hours: 'Mon–Sat: 9 AM–5 PM' },
            { title: 'Medical Room', phone: '0800-MEDICAL', email: 'medical@university.edu', hours: '24/7 Emergency' },
            { title: 'Security Desk', phone: '0800-SECURE', email: 'security@university.edu', hours: '24/7' },
          ].map(c => (
            <div key={c.title} className="card">
              <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-sm text-gray-600">📞 {c.phone}</p>
              <p className="text-sm text-gray-600">✉️ {c.email}</p>
              <p className="text-xs text-gray-400 mt-2">🕐 {c.hours}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">⭐ Hostel Feedback</h2>
        {submitted ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🙏</div>
            <p className="font-semibold text-gray-900">Thank you for your feedback!</p>
            <p className="text-gray-500 text-sm mt-1">Your response helps us improve hostel services.</p>
          </div>
        ) : (
          <form onSubmit={submitFeedback} className="card space-y-4">
            <p className="text-sm text-gray-600">Rate your overall hostel experience:</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setFeedbackRating(s)}>
                  <StarSolid className={`w-9 h-9 transition-colors ${s <= feedbackRating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`} />
                </button>
              ))}
              {feedbackRating > 0 && (
                <span className="text-sm text-gray-500 self-center ml-2">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackRating]}
                </span>
              )}
            </div>
            <div>
              <label className="label">Additional Comments</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Share your suggestions or experiences..."
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto px-8">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
