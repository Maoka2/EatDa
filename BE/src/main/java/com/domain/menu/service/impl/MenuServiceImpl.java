package com.domain.menu.service.impl;

import com.domain.menu.entity.Menu;
import com.domain.menu.repository.MenuRepository;
import com.domain.menu.service.MenuService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final MenuRepository menuRepository;

    @Override
    public List<Menu> getMenuList(final Long storeId) {
        return menuRepository.findByStoreId(storeId);
    }
}
