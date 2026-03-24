import type { Post, HotTopic, OnlineExpert } from './types'

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: {
      id: 'u1',
      name: 'Nguyễn Văn Nam',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    timestamp: '2 giờ trước',
    location: 'Di Linh, Lâm Đồng',
    content: 'Lá cà phê nhà tôi xuất hiện đốm vàng lạ, có phải bị rỉ sắt không thưa chuyên gia?\nMong mọi người tư vấn cách xử lý gấp để tránh lây lan cho cả vườn. Cảm ơn cả nhà!',
    images: ['https://placehold.co/600x400/E2E8F0/64748B?text=Ảnh+lá+cà+phê'],
    isUrgent: true,
    likes: 24,
    comments: 2, // 2 comments shown below
    shares: 0,
    commentsList: [
      {
        id: 'c1',
        author: { id: 'e1', name: 'Kỹ sư Lê Anh', avatar: 'https://i.pravatar.cc/150?img=68' },
        timestamp: '1 giờ trước',
        content: 'Chào bạn, nhìn qua hình ảnh thì đây rất có thể là bệnh rỉ sắt giai đoạn đầu. Bạn nên cắt bỏ các lá bị bệnh và phun xịt thuốc gốc đồng nhé!',
        likes: 12,
        replies: [
          {
            id: 'r1',
            author: { id: 'u1', name: 'Nguyễn Văn Nam', avatar: 'https://i.pravatar.cc/150?img=12' },
            timestamp: '45 phút trước',
            content: 'Cảm ơn kỹ sư nhiều ạ! Vườn em đang mưa nhiều quá, xịt thuốc mùa này có sợ rửa trôi không ạ?',
            likes: 2
          }
        ]
      },
      {
        id: 'c2',
        author: { id: 'u3', name: 'Hoàng Minh', avatar: 'https://i.pravatar.cc/150?img=33' },
        timestamp: '30 phút trước',
        content: 'Vườn mình tháng trước cũng bị vậy, lây lan nhanh lắm. Xử lý sớm đi bác.',
        likes: 5
      }
    ]
  },
  {
    id: 'p2',
    author: {
      id: 'u2',
      name: 'Trần Thị Lan',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    timestamp: '5 giờ trước',
    location: 'Buôn Ma Thuột',
    content: 'Mùa thu hoạch năm nay cà phê chín đều và đẹp quá mọi người ơi. Hy vọng giá năm nay sẽ ổn định để bà con mình có cái Tết ấm no.',
    images: ['https://placehold.co/600x400/FEF3C7/D97706?text=Cà+phê+chín'],
    isUrgent: false,
    likes: 156,
    comments: 0,
    shares: 5,
    commentsList: []
  }
]

export const MOCK_HOT_TOPICS: HotTopic[] = [
  {
    id: 't1',
    tag: '#KỹThuậtCanhTác',
    title: 'Cách ủ phân hữu cơ hiệu quả',
    engagementText: '1.2k người đang thảo luận'
  },
  {
    id: 't2',
    tag: '#ThịTrường',
    title: 'Dự báo giá cà phê tuần tới',
    engagementText: '856 người đang quan tâm'
  },
  {
    id: 't3',
    tag: '#SâuBệnh',
    title: 'Phòng trị rệp sáp mùa khô',
    engagementText: '540 người đang chia sẻ'
  }
]

export const MOCK_EXPERTS: OnlineExpert[] = [
  {
    id: 'e1',
    name: 'Kỹ sư Lê Anh',
    avatar: 'https://i.pravatar.cc/150?img=68',
    specialty: 'BVTV & Dinh dưỡng',
    isOnline: true
  },
  {
    id: 'e2',
    name: 'TS. Nguyễn Hòa',
    avatar: 'https://i.pravatar.cc/150?img=32',
    specialty: 'Giống cây trồng',
    isOnline: true
  }
]
